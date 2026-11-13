<?php
/**
 * Real WordPress integration checks. Run on a disposable local site:
 * wp eval-file wp-content/plugins/mk-simple-live-search/tests/rest-api-integration.php
 * Fixtures and the test administrator are removed after the run.
 */

if ( ! defined( 'ABSPATH' ) || ! function_exists( 'mk_simple_handle_search' ) ) {
	throw new RuntimeException( 'Load WordPress and activate MK Simple Live Search first.' );
}

$mk_test_original_user = get_current_user_id();
$mk_test_original_post = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
$mk_test_ids           = array();
$mk_test_admin         = 0;
$mk_test_count         = 0;
$mk_test_token         = 'mkstest' . strtolower( wp_generate_password( 8, false, false ) );
$mk_test_types         = array( 'mks_test_public', 'mks_test_private', 'mks_test_hidden', 'mks_test_excluded' );

$mk_test_assert = function ( $condition, $message ) use ( &$mk_test_count ) {
	if ( ! $condition ) {
		throw new RuntimeException( 'FAIL: ' . $message );
	}
	++$mk_test_count;
};

$mk_test_request = function ( $parameters ) {
	$request = new WP_REST_Request( 'GET', '/mk-simple/v1/search' );
	$request->set_query_params( $parameters );
	return rest_do_request( $request );
};

$mk_test_insert = function ( $attributes ) use ( &$mk_test_ids ) {
	$id = wp_insert_post( array_merge( array( 'post_title' => 'Fixture', 'post_status' => 'publish', 'post_type' => 'post' ), $attributes ), true );
	if ( is_wp_error( $id ) ) {
		throw new RuntimeException( $id->get_error_message() );
	}
	$mk_test_ids[] = $id;
	return $id;
};

try {
	register_post_type( 'mks_test_public', array( 'public' => true, 'exclude_from_search' => false ) );
	register_post_type( 'mks_test_private', array( 'public' => false ) );
	register_post_type( 'mks_test_hidden', array( 'public' => true, 'publicly_queryable' => false, 'exclude_from_search' => false ) );
	register_post_type( 'mks_test_excluded', array( 'public' => true, 'exclude_from_search' => true ) );

	$mk_test_admin = wp_insert_user( array( 'user_login' => $mk_test_token, 'user_pass' => wp_generate_password( 32 ), 'role' => 'administrator' ) );
	if ( is_wp_error( $mk_test_admin ) ) {
		throw new RuntimeException( $mk_test_admin->get_error_message() );
	}

	$title_id   = $mk_test_insert( array( 'post_title' => $mk_test_token . 'title', 'post_content' => 'Unrelated body' ) );
	$content_id = $mk_test_insert( array( 'post_title' => 'Body fixture', 'post_content' => $mk_test_token . 'content' ) );
	$mk_test_insert( array( 'post_title' => 'Excerpt fixture', 'post_excerpt' => $mk_test_token . 'excerpt' ) );
	$public_id = $mk_test_insert( array( 'post_title' => $mk_test_token . 'visibility' ) );
	$page_id   = $mk_test_insert( array( 'post_title' => $mk_test_token . 'page', 'post_type' => 'page' ) );
	$mk_test_insert( array( 'post_title' => $mk_test_token . 'visibility private', 'post_status' => 'private' ) );
	$mk_test_insert( array( 'post_title' => $mk_test_token . 'visibility draft', 'post_status' => 'draft' ) );
	$mk_test_insert( array( 'post_title' => $mk_test_token . 'visibility pending', 'post_status' => 'pending' ) );
	$mk_test_insert( array( 'post_title' => $mk_test_token . 'visibility future', 'post_status' => 'future', 'post_date' => gmdate( 'Y-m-d H:i:s', time() + DAY_IN_SECONDS ) ) );
	$mk_test_insert( array( 'post_title' => $mk_test_token . 'visibility protected', 'post_password' => 'test-password' ) );
	$custom_id = $mk_test_insert( array( 'post_title' => $mk_test_token . 'custom', 'post_type' => 'mks_test_public' ) );
	$entity_title = $mk_test_token . 'entity &amp; &#8212; &quot;Test&quot;';
	$mk_test_insert( array( 'post_title' => $entity_title ) );
	for ( $index = 0; $index < 22; ++$index ) {
		$mk_test_insert( array( 'post_title' => $mk_test_token . 'limit ' . $index ) );
	}

	wp_set_current_user( 0 );
	foreach ( array( 'both', 'title' ) as $mode ) {
		$response = $mk_test_request( array( 'query' => $mk_test_token . 'title', 'search_in' => $mode ) );
		$mk_test_assert( 200 === $response->get_status() && array( get_permalink( $title_id ) ) === wp_list_pluck( $response->get_data(), 'url' ), $mode . ' finds the title fixture: ' . wp_json_encode( array( 'status' => $response->get_status(), 'data' => $response->get_data() ) ) );
	}
	$response = $mk_test_request( array( 'query' => $mk_test_token . 'title', 'search_in' => 'content' ) );
	$mk_test_assert( array() === $response->get_data(), 'content mode does not search titles' );
	foreach ( array( 'both', 'content' ) as $mode ) {
		$response = $mk_test_request( array( 'query' => $mk_test_token . 'content', 'search_in' => $mode ) );
		$mk_test_assert( array( get_permalink( $content_id ) ) === wp_list_pluck( $response->get_data(), 'url' ), $mode . ' finds content' );
	}
	$response = $mk_test_request( array( 'query' => $mk_test_token . 'content', 'search_in' => 'title' ) );
	$mk_test_assert( array() === $response->get_data(), 'title mode does not search content' );
	$response = $mk_test_request( array( 'query' => $mk_test_token . 'excerpt' ) );
	$mk_test_assert( array() === $response->get_data(), 'both excludes excerpt-only matches' );
	$response = $mk_test_request( array( 'query' => $mk_test_token . 'page' ) );
	$mk_test_assert( array( get_permalink( $page_id ) ) === wp_list_pluck( $response->get_data(), 'url' ), 'default types include pages' );

	foreach ( array( 0, $mk_test_admin ) as $user_id ) {
		wp_set_current_user( $user_id );
		$response = $mk_test_request( array( 'query' => $mk_test_token . 'visibility' ) );
		$mk_test_assert( 200 === $response->get_status() && array( get_permalink( $public_id ) ) === wp_list_pluck( $response->get_data(), 'url' ), 'only published unprotected posts are visible as user ' . $user_id );
	}
	wp_set_current_user( 0 );
	$response = $mk_test_request( array( 'query' => $mk_test_token . 'custom', 'post_type' => 'mks_test_public' ) );
	$mk_test_assert( array( get_permalink( $custom_id ) ) === wp_list_pluck( $response->get_data(), 'url' ), 'public searchable custom types work' );
	$response = $mk_test_request( array( 'query' => $mk_test_token . 'custom' ) );
	$mk_test_assert( array() === $response->get_data(), 'custom types require explicit selection' );
	$response = $mk_test_request( array( 'query' => $mk_test_token . 'entity' ) );
	$mk_test_assert( $mk_test_token . 'entity & — "Test"' === $response->get_data()[0]['title'], 'HTML entities are returned as plain Unicode text' );

	foreach ( array( array(), array( 'query' => '' ), array( 'query' => 'ab' ), array( 'query' => array( 'bad' ) ), array( 'query' => str_repeat( 'я', 101 ) ), array( 'query' => '   ' ) ) as $parameters ) {
		$response = $mk_test_request( $parameters );
		$mk_test_assert( 400 === $response->get_status(), 'missing, short, long, blank, and array queries are rejected' );
	}
	$response = $mk_test_request( array( 'query' => 'кот' ) );
	$mk_test_assert( 200 === $response->get_status(), 'three Cyrillic characters are accepted' );
	$response = $mk_test_request( array( 'query' => str_repeat( 'я', 100 ) ) );
	$mk_test_assert( 200 === $response->get_status(), '100 Unicode characters are accepted' );
	foreach ( array( -1, 0, 21, 'nonsense', array( 5 ), '1.5' ) as $limit ) {
		$response = $mk_test_request( array( 'query' => $mk_test_token, 'posts_per_page' => $limit ) );
		$mk_test_assert( 400 === $response->get_status(), 'unsafe or malformed result limits are rejected' );
	}
	foreach ( array( 'any', 'attachment,revision', 'mks_test_private', 'mks_test_hidden', 'mks_test_excluded', 'does_not_exist', array( 'post' ), 'post,' ) as $type ) {
		$response = $mk_test_request( array( 'query' => $mk_test_token, 'post_type' => $type ) );
		$mk_test_assert( 400 === $response->get_status(), 'nonpublic, unsearchable, and malformed post types are rejected' );
	}
	foreach ( array( 'excerpt', 'TITLE', array( 'title' ) ) as $mode ) {
		$response = $mk_test_request( array( 'query' => $mk_test_token, 'search_in' => $mode ) );
		$mk_test_assert( 400 === $response->get_status(), 'unsupported search modes are rejected' );
	}
	foreach ( array( 1, 20 ) as $limit ) {
		$response = $mk_test_request( array( 'query' => $mk_test_token . 'limit', 'posts_per_page' => $limit ) );
		$mk_test_assert( $limit === count( $response->get_data() ), 'explicit result limit ' . $limit . ' is respected' );
	}
	$response = $mk_test_request( array( 'query' => $mk_test_token . 'limit' ) );
	$mk_test_assert( 10 === count( $response->get_data() ), 'default result limit is ten' );

	$GLOBALS['post'] = get_post( $title_id );
	$before_post     = $GLOBALS['post'];
	$mk_test_request( array( 'query' => $mk_test_token . 'content' ) );
	$mk_test_assert( $before_post === $GLOBALS['post'], 'search leaves the global post untouched' );
	$mk_test_assert( 20 === mk_simple_search_limit( PHP_INT_MAX ), 'shortcode limits remain bounded' );
	$mk_test_assert( array( 'post', 'page' ) === mk_simple_search_post_types( '' ), 'empty shortcode types use documented defaults' );

	echo 'PASS: ' . $mk_test_count . " WordPress REST integration assertions.\n";
} finally {
	wp_set_current_user( $mk_test_original_user );
	$GLOBALS['post'] = $mk_test_original_post;
	foreach ( $mk_test_ids as $id ) {
		wp_delete_post( $id, true );
	}
	if ( is_int( $mk_test_admin ) && $mk_test_admin > 0 ) {
		require_once ABSPATH . 'wp-admin/includes/user.php';
		wp_delete_user( $mk_test_admin );
	}
	foreach ( $mk_test_types as $type ) {
		unregister_post_type( $type );
	}
}

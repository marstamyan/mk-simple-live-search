<?php
/**
 * Public, read-only live search endpoint.
 *
 * @package MK_Simple_Live_Search
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Normalize the result limit used in shortcode attributes.
 * REST requests use strict schema validation instead of silently clamping.
 */
function mk_simple_search_limit( $value ) {
	if ( ! is_scalar( $value ) || ! preg_match( '/^-?\d+$/', (string) $value ) ) {
		return 10;
	}

	return max( 1, min( 20, (int) $value ) );
}

/**
 * Resolve only explicitly public, searchable post types.
 *
 * @return string[]|WP_Error
 */
function mk_simple_search_post_types( $value ) {
	if ( ! is_string( $value ) ) {
		return new WP_Error( 'mk_simple_invalid_post_type', __( 'Post types must be a comma-separated list.', 'mk-simple-live-search' ), array( 'status' => 400 ) );
	}

	$value = trim( $value );
	$types = '' === $value ? array( 'post', 'page' ) : explode( ',', $value );
	$types = array_values( array_unique( array_map( 'trim', $types ) ) );

	foreach ( $types as $type ) {
		$object = get_post_type_object( $type );
		if ( ! preg_match( '/^[a-z0-9_-]+$/', $type ) || ! $object || ! $object->public || ! is_post_type_viewable( $object ) || $object->exclude_from_search ) {
			return new WP_Error( 'mk_simple_invalid_post_type', __( 'Only public, searchable post types are supported.', 'mk-simple-live-search' ), array( 'status' => 400 ) );
		}
	}

	return $types;
}

/** Validate the normalized query without allowing arrays or invalid UTF-8. */
function mk_simple_validate_search_query( $value ) {
	if ( ! is_string( $value ) ) {
		return new WP_Error( 'mk_simple_invalid_query', __( 'The search query must be text.', 'mk-simple-live-search' ), array( 'status' => 400 ) );
	}

	$query  = trim( sanitize_text_field( $value ) );
	$length = preg_match_all( '/./us', $query );
	if ( false === $length || $length < 3 || $length > 100 ) {
		return new WP_Error( 'mk_simple_invalid_query', __( 'Enter between 3 and 100 characters.', 'mk-simple-live-search' ), array( 'status' => 400 ) );
	}

	return true;
}

/** Validate the public type list before the request reaches WP_Query. */
function mk_simple_validate_search_post_types( $value ) {
	$types = mk_simple_search_post_types( $value );
	return is_wp_error( $types ) ? $types : true;
}

function mk_simple_register_rest_route() {
	register_rest_route(
		'mk-simple/v1',
		'/search',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'mk_simple_handle_search',
			// Deliberately public: this endpoint returns published, unprotected content only.
			'permission_callback' => '__return_true',
			'args'                => array(
				'query'          => array(
					'type'              => 'string',
					'required'          => true,
					'validate_callback' => 'mk_simple_validate_search_query',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'posts_per_page' => array(
					'type'    => 'integer',
					'default' => 10,
					'minimum' => 1,
					'maximum' => 20,
				),
				'search_in'      => array(
					'type'    => 'string',
					'default' => 'both',
					'enum'    => array( 'both', 'title', 'content' ),
				),
				'post_type'      => array(
					'type'              => 'string',
					'default'           => 'post,page',
					'validate_callback' => 'mk_simple_validate_search_post_types',
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'mk_simple_register_rest_route' );

function mk_simple_handle_search( WP_REST_Request $request ) {
	$post_types = mk_simple_search_post_types( $request->get_param( 'post_type' ) );
	if ( is_wp_error( $post_types ) ) {
		return $post_types;
	}

	$columns = array( 'post_title', 'post_content' );
	if ( 'title' === $request->get_param( 'search_in' ) ) {
		$columns = array( 'post_title' );
	} elseif ( 'content' === $request->get_param( 'search_in' ) ) {
		$columns = array( 'post_content' );
	}

	$query_results = new WP_Query(
		array(
			'post_type'              => $post_types,
			'post_status'            => 'publish',
			'has_password'           => false,
			'posts_per_page'         => (int) $request->get_param( 'posts_per_page' ),
			's'                      => trim( $request->get_param( 'query' ) ),
			'search_columns'         => $columns,
			'no_found_rows'          => true,
			'ignore_sticky_posts'    => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		)
	);

	$results = array();
	foreach ( $query_results->posts as $post ) {
		// Keep the response public even if another plugin modifies the query.
		if ( 'publish' !== $post->post_status || '' !== $post->post_password || ! in_array( $post->post_type, $post_types, true ) || ! is_post_publicly_viewable( $post ) ) {
			continue;
		}

		$title     = wp_strip_all_tags( html_entity_decode( get_the_title( $post ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
		$results[] = array(
			'title' => '' !== trim( $title ) ? $title : __( '(no title)', 'mk-simple-live-search' ),
			'url'   => get_permalink( $post ),
		);
	}

	return rest_ensure_response( $results );
}

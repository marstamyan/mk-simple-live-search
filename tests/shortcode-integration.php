<?php
/** Run with: wp eval-file tests/shortcode-integration.php (disposable site only). */
if ( ! defined( 'ABSPATH' ) || ! function_exists( 'mk_simple_live_search_form' ) ) {
	fwrite( STDERR, "Load this file inside a disposable WordPress installation.\n" );
	exit( 1 );
}

$mk_checks = 0;
$mk_check = static function ( $condition, $message ) use ( &$mk_checks ) {
	if ( ! $condition ) {
		throw new RuntimeException( $message );
	}
	++$mk_checks;
	echo "PASS: $message\n";
};

$mk_html = do_shortcode( '[mk_simple_live_search][mk_simple_live_search search_in="title" posts_per_page="5"]' );
preg_match_all( '/<input[^>]*\bid="([^"]+)"/', $mk_html, $mk_ids );
$mk_check( 2 === count( $mk_ids[1] ) && $mk_ids[1][0] !== $mk_ids[1][1], 'Multiple fields have unique input IDs.' );
foreach ( $mk_ids[1] as $mk_id ) {
	$mk_check( false !== strpos( $mk_html, 'for="' . $mk_id . '"' ), 'Every input has an associated label.' );
	$mk_check( false !== strpos( $mk_html, 'aria-controls="' . $mk_id . '-results"' ), 'Every field controls its own results.' );
}
$mk_check( 2 === substr_count( $mk_html, 'role="status"' ), 'Every field has a live status.' );
$mk_check( false !== strpos( $mk_html, 'data-posts-per-page="5"' ) && false !== strpos( $mk_html, 'data-search-in="title"' ), 'Per-field settings survive rendering.' );
$mk_check( wp_script_is( 'mk-simple-live-search', 'enqueued' ), 'Shortcode enqueues its JavaScript.' );

$mk_html = do_shortcode( '[mk_simple_live_search posts_per_page="-1" search_in="invalid"]' );
$mk_check( false !== strpos( $mk_html, 'data-posts-per-page="1"' ), 'Negative limits cannot create unbounded queries.' );
$mk_check( false !== strpos( $mk_html, 'data-search-in="both"' ), 'Invalid shortcode search mode defaults to both.' );
$mk_html = do_shortcode( '[mk_simple_live_search posts_per_page="999999"]' );
$mk_check( false !== strpos( $mk_html, 'data-posts-per-page="20"' ), 'Excessive shortcode result limit is bounded.' );
$mk_html = do_shortcode( '[mk_simple_live_search post_type="revision"]' );
$mk_check( false === strpos( $mk_html, '<input' ), 'Internal post types are not silently searched.' );
$mk_html = do_shortcode( '[mk_simple_live_search post_type="missing_cpt"]' );
$mk_check( false === strpos( $mk_html, '<input' ), 'Unknown post types produce configuration feedback.' );

wp_dequeue_style( 'mk-simple-live-admin-styles' );
mk_simple_admin_enqueue_scripts( 'edit.php' );
$mk_check( ! wp_style_is( 'mk-simple-live-admin-styles', 'enqueued' ), 'Admin CSS does not load on unrelated screens.' );
mk_simple_admin_enqueue_scripts( 'toplevel_page_mk-simple-live-search-info' );
$mk_check( wp_style_is( 'mk-simple-live-admin-styles', 'enqueued' ), 'Admin CSS loads on plugin usage page.' );

echo "Shortcode integration: $mk_checks checks passed.\n";

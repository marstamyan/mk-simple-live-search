<?php
/**
 * Plugin Name: MK Simple Live Search
 * Description: A simple live search plugin using WordPress REST API.
 * Version: 1.1.0
 * Requires at least: 6.2
 * Requires PHP: 7.4
 * Author: Mamikon
 * Author URI: https://linkedin.com/in/mamikon-arustamyan-3969301ab/
 * License: GPL-2.0+
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: mk-simple-live-search
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . 'includes/rest-api.php';
require_once plugin_dir_path( __FILE__ ) . 'admin/menu.php';

define( 'MK_SIMPLE_LIVE_SEARCH_VERSION', '1.1.0' );

function mk_simple_enqueue_scripts() {
	// A small shared stylesheet also covers shortcodes rendered late by widgets.
	wp_enqueue_style( 'mk-simple-live-search', plugin_dir_url( __FILE__ ) . 'assets/css/mk-simple-live-search.css', array(), MK_SIMPLE_LIVE_SEARCH_VERSION );
	wp_register_script( 'mk-simple-live-search', plugin_dir_url( __FILE__ ) . 'assets/js/mk-simple-live-search.js', array(), MK_SIMPLE_LIVE_SEARCH_VERSION, true );
}
add_action( 'wp_enqueue_scripts', 'mk_simple_enqueue_scripts' );

function mk_simple_admin_enqueue_scripts( $hook ) {
	if ( 'toplevel_page_mk-simple-live-search-info' === $hook ) {
		wp_enqueue_style( 'mk-simple-live-admin-styles', plugin_dir_url( __FILE__ ) . 'admin/admin-styles.css', array(), MK_SIMPLE_LIVE_SEARCH_VERSION );
	}
}
add_action( 'admin_enqueue_scripts', 'mk_simple_admin_enqueue_scripts' );

function mk_simple_live_search_form( $atts ) {
	$atts = shortcode_atts( array(
		'posts_per_page' => 10,
		'search_in' => 'both',
		'post_type' => '',
	), $atts, 'mk_simple_live_search' );

	$post_types = mk_simple_search_post_types( $atts['post_type'] );
	if ( is_wp_error( $post_types ) ) {
		return '<p class="mk-simple-error">' . esc_html__( 'Search is unavailable. Check the shortcode post_type setting.', 'mk-simple-live-search' ) . '</p>';
	}
	$limit     = mk_simple_search_limit( $atts['posts_per_page'] );
	$search_in = in_array( $atts['search_in'], array( 'both', 'title', 'content' ), true ) ? $atts['search_in'] : 'both';
	$input_id  = wp_unique_id( 'mk-simple-live-search-input-' );
	$results_id = $input_id . '-results';
	$status_id  = $input_id . '-status';

	if ( ! wp_script_is( 'mk-simple-live-search', 'registered' ) ) {
		mk_simple_enqueue_scripts();
	}
	if ( ! wp_script_is( 'mk-simple-live-search', 'enqueued' ) ) {
		wp_enqueue_script( 'mk-simple-live-search' );
		wp_localize_script( 'mk-simple-live-search', 'mkSimpleLiveSearch', array(
			'ajax_url' => esc_url_raw( rest_url( 'mk-simple/v1/search' ) ),
			'strings'  => array(
				'loading'     => __( 'Searching…', 'mk-simple-live-search' ),
				'noResults'   => __( 'Nothing found.', 'mk-simple-live-search' ),
				'error'       => __( 'Search could not be completed. Please try again.', 'mk-simple-live-search' ),
				'resultCount' => __( 'Results found: %d.', 'mk-simple-live-search' ),
				'untitled'    => __( '(Untitled)', 'mk-simple-live-search' ),
			),
		) );
	}

	ob_start();
	?>
	<div class="mk-simple-live-search">
		<div class="mk-simple-live-search-wrapper">
			<label class="mk-simple-sr-only" for="<?php echo esc_attr( $input_id ); ?>"><?php esc_html_e( 'Search the site', 'mk-simple-live-search' ); ?></label>
			<input type="search" class="mk-simple-live-search-input" id="<?php echo esc_attr( $input_id ); ?>" placeholder="<?php esc_attr_e( 'Search…', 'mk-simple-live-search' ); ?>"
				autocomplete="off" maxlength="100" aria-controls="<?php echo esc_attr( $results_id ); ?>" aria-describedby="<?php echo esc_attr( $status_id ); ?>"
				data-posts-per-page="<?php echo esc_attr( $limit ); ?>"
				data-search-in="<?php echo esc_attr( $search_in ); ?>"
				data-post-type="<?php echo esc_attr( implode( ',', $post_types ) ); ?>" />
			<div class="mk-simple-live-search-results" id="<?php echo esc_attr( $results_id ); ?>" hidden></div>
			<span class="mk-simple-live-search-status mk-simple-sr-only" id="<?php echo esc_attr( $status_id ); ?>" role="status" aria-live="polite" aria-atomic="true"><?php esc_html_e( 'Enter at least 3 characters to search.', 'mk-simple-live-search' ); ?></span>
		</div>
	</div>
	<?php
	return ob_get_clean();
}

add_shortcode( 'mk_simple_live_search', 'mk_simple_live_search_form' );

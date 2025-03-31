<?php
/**
 * Plugin Name: MK Simple Live Search
 * Description: A simple live search plugin using WordPress REST API.
 * Version: 1.0
 * Author: Mamikon
 * Author URI: https://linkedin.com/in/mamikon-arustamyan-3969301ab?/
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain: mk-simple-live-search
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once plugin_dir_path( __FILE__ ) . 'includes/rest-api.php';
require_once plugin_dir_path( __FILE__ ) . 'admin/menu.php';

function mk_simple_enqueue_scripts() {
	wp_enqueue_style( 'mk-simple-live-search', plugin_dir_url( __FILE__ ) . 'assets/css/mk-simple-live-search.css', array(), '1.0' );
	wp_enqueue_script( 'mk-simple-live-search', plugin_dir_url( __FILE__ ) . 'assets/js/mk-simple-live-search.js', array(), '1.0', true );
	wp_localize_script( 'mk-simple-live-search', 'mkSimpleLiveSearch', array(
		'ajax_url' => rest_url( 'mk-simple/v1/search' ),
		'nonce' => wp_create_nonce( 'mk-simple-live-search' )
	) );
}
add_action( 'wp_enqueue_scripts', 'mk_simple_enqueue_scripts' );

function mk_simple_admin_enqueue_scripts( $hook ) {
	wp_enqueue_style( 'mk-simple-live-admin-styles', plugin_dir_url( __FILE__ ) . 'admin/admin-styles.css' );
}
add_action( 'admin_enqueue_scripts', 'mk_simple_admin_enqueue_scripts' );

function mk_simple_live_search_form( $atts ) {
	$atts = shortcode_atts( array(
		'posts_per_page' => 10,
		'search_in' => 'both',
		'post_type' => '',
	), $atts, 'mk_simple_live_search' );

	ob_start();
	?>
	<div class="mk-simple-live-search">
		<div class="mk-simple-live-search-wrapper">
			<input type="text" id="mk-simple-live-search-input" placeholder="Search..."
				data-posts-per-page="<?php echo intval( $atts['posts_per_page'] ); ?>"
				data-search-in="<?php echo esc_attr( $atts['search_in'] ); ?>"
				data-post-type="<?php echo esc_attr( $atts['post_type'] ); ?>" />
			<div id="mk-simple-live-search-results"></div>
		</div>
	</div>
	<?php
	return ob_get_clean();
}

add_shortcode( 'mk_simple_live_search', 'mk_simple_live_search_form' );
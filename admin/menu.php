<?php
/** Usage page for site administrators. */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function mk_simple_live_search_add_admin_menu() {
	add_menu_page(
		__( 'Simple Live Search', 'mk-simple-live-search' ),
		__( 'Live Search Info', 'mk-simple-live-search' ),
		'manage_options',
		'mk-simple-live-search-info',
		'mk_simple_live_search_info_page',
		'dashicons-search',
		90
	);
}
add_action( 'admin_menu', 'mk_simple_live_search_add_admin_menu' );

function mk_simple_live_search_info_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$examples = array(
		'[mk_simple_live_search]' => __( 'Search published posts and pages by title and content.', 'mk-simple-live-search' ),
		'[mk_simple_live_search search_in="title"]' => __( 'Search titles only.', 'mk-simple-live-search' ),
		'[mk_simple_live_search search_in="content"]' => __( 'Search content only.', 'mk-simple-live-search' ),
		'[mk_simple_live_search posts_per_page="5"]' => __( 'Show up to 5 results (allowed range: 1–20; default: 10).', 'mk-simple-live-search' ),
		'[mk_simple_live_search post_type="portfolio"]' => __( 'Search an existing public, searchable custom post type.', 'mk-simple-live-search' ),
		'[mk_simple_live_search post_type="post,page"]' => __( 'Search multiple post types using a comma-separated list.', 'mk-simple-live-search' ),
	);
	?>
	<div class="wrap mk-simple-wrap">
		<h1 class="mk-simple-title"><?php esc_html_e( 'Simple Live Search — Usage Instructions', 'mk-simple-live-search' ); ?></h1>
		<p class="mk-simple-description"><?php esc_html_e( 'Add a Shortcode block to a page or post and paste one of these examples.', 'mk-simple-live-search' ); ?></p>
		<h2 class="mk-simple-subtitle"><?php esc_html_e( 'Available Shortcodes', 'mk-simple-live-search' ); ?></h2>
		<ul class="mk-simple-shortcodes-list">
			<?php foreach ( $examples as $shortcode => $description ) : ?>
				<li class="mk-simple-shortcode-item"><code><?php echo esc_html( $shortcode ); ?></code> — <?php echo esc_html( $description ); ?></li>
			<?php endforeach; ?>
		</ul>
		<h2 class="mk-simple-subtitle"><?php esc_html_e( 'How search works', 'mk-simple-live-search' ); ?></h2>
		<p class="mk-simple-paragraph"><?php esc_html_e( 'Results appear after at least 3 characters. Multiple search fields can be used on the same page with independent settings.', 'mk-simple-live-search' ); ?></p>
		<p class="mk-simple-paragraph"><?php esc_html_e( 'Only published content without a password is included. Drafts, private posts and internal post types are excluded, even for administrators.', 'mk-simple-live-search' ); ?></p>
		<p class="mk-simple-paragraph"><?php esc_html_e( 'Use Arrow Down or Arrow Up to move through results, Enter to open a link, and Escape to close results. Tab also works normally.', 'mk-simple-live-search' ); ?></p>
		<p class="mk-simple-paragraph"><?php esc_html_e( 'The plugin does not create custom post types. The post_type value must match a type registered by your theme or another plugin.', 'mk-simple-live-search' ); ?></p>
	</div>
	<?php
}

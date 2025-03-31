<?php

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function mk_simple_register_rest_route() {
	register_rest_route( 'mk-simple/v1', '/search', array(
		'methods' => 'GET',
		'callback' => 'mk_simple_handle_search',
		'permission_callback' => '__return_true',
	) );
}
add_action( 'rest_api_init', 'mk_simple_register_rest_route' );

function mk_simple_handle_search( WP_REST_Request $request ) {
	$query = sanitize_text_field( $request->get_param( 'query' ) );
	$posts_per_page = intval( $request->get_param( 'posts_per_page' ) ) ?: 10;
	$search_in = sanitize_text_field( $request->get_param( 'search_in' ) ) ?: 'both';
	$post_type = $request->get_param( 'post_type' ) ? explode( ',', sanitize_text_field( $request->get_param( 'post_type' ) ) ) : array( 'post', 'page' );

	$args = array(
		'post_type' => $post_type,
		'posts_per_page' => $posts_per_page,
		's' => $query,
	);

	if ( $search_in === 'title' ) {
		$args['search_columns'] = array( 'post_title' );
	} elseif ( $search_in === 'content' ) {
		$args['search_columns'] = array( 'post_content' );
	}

	$query_results = new WP_Query( $args );
	$results = array();

	if ( $query_results->have_posts() ) {
		while ( $query_results->have_posts() ) {
			$query_results->the_post();
			$results[] = array(
				'title' => get_the_title(),
				'url' => get_permalink(),
			);
		}
	}

	wp_reset_postdata();
	return rest_ensure_response( $results );
}

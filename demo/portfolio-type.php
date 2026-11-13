<?php
/** Demo fixture only: copy to wp-content/mu-plugins/ on a disposable local site. */
if ( ! defined( 'ABSPATH' ) ) { exit; }
add_action( 'init', function () {
    register_post_type( 'portfolio', array(
        'label' => 'Портфолио', 'public' => true, 'show_in_rest' => true,
        'supports' => array( 'title', 'editor' ),
    ) );
} );

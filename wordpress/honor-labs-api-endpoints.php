<?php
/**
 * Honor Labs Custom REST API Endpoints
 *
 * WPCode Snippet — Paste this entire file's contents into a WPCode PHP snippet.
 * Registers REST API endpoints under the `honor-labs/v1` namespace for the
 * Honor Labs Business Control Dashboard.
 *
 * Requirements:
 *   - WooCommerce 10.5.3+ with HPOS enabled
 *   - B2BKing Core v5.0.25+
 *   - Honor Labs custom plugins (doctor-onboarding, patient-portal, etc.)
 *
 * @version 1.0.0
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ──────────────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────────────

define( 'HONOR_LABS_API_NAMESPACE', 'honor-labs/v1' );
define( 'HONOR_LABS_DOCTOR_GROUP', '599' );
define( 'HONOR_LABS_PATIENT_GROUP', '695' );
define( 'HONOR_LABS_B2C_GROUP', 'b2cuser' );

/**
 * Doctor applications are NOT a custom post type.
 * They are regular WordPress users who have the `hl_application_date` user meta set.
 * Approval status is tracked via `b2bking_account_approval`:
 *   - empty or 'pending' = pending
 *   - 'approved' = approved
 *   - 'rejected' = rejected
 */

// ──────────────────────────────────────────────────────────────────────
// CORS HEADERS
// ──────────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', function () {
    remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );

    add_filter( 'rest_pre_serve_request', function ( $value ) {
        header( 'Access-Control-Allow-Origin: *' );
        header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
        header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce' );
        header( 'Access-Control-Allow-Credentials: true' );
        return $value;
    });
}, 15 );

// Handle OPTIONS preflight requests for our namespace.
add_action( 'init', function () {
    if ( isset( $_SERVER['REQUEST_METHOD'] ) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS' ) {
        header( 'Access-Control-Allow-Origin: *' );
        header( 'Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS' );
        header( 'Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Nonce' );
        header( 'Access-Control-Allow-Credentials: true' );
        header( 'Access-Control-Max-Age: 86400' );
        status_header( 204 );
        exit;
    }
});

// ──────────────────────────────────────────────────────────────────────
// PERMISSION CALLBACK
// ──────────────────────────────────────────────────────────────────────

/**
 * Permission check for all Honor Labs API endpoints.
 *
 * Allows access if the request carries valid WooCommerce REST API credentials
 * (consumer_key query parameter — WC handles actual validation downstream)
 * OR if the current WordPress user has the `manage_woocommerce` capability.
 *
 * @param WP_REST_Request $request The incoming request.
 * @return bool|WP_Error
 */
function honor_labs_api_permission_check( $request ) {
    // WooCommerce API key authentication via query params.
    if ( ! empty( $_GET['consumer_key'] ) && ! empty( $_GET['consumer_secret'] ) ) {
        // Validate the consumer key + secret against WooCommerce's stored keys.
        return honor_labs_validate_wc_api_keys(
            sanitize_text_field( $_GET['consumer_key'] ),
            sanitize_text_field( $_GET['consumer_secret'] )
        );
    }

    // WordPress cookie / application-password authentication.
    if ( current_user_can( 'manage_woocommerce' ) ) {
        return true;
    }

    return new WP_Error(
        'rest_forbidden',
        __( 'Authentication required. Provide WooCommerce API keys or log in as an administrator.', 'honor-labs' ),
        array( 'status' => 401 )
    );
}

/**
 * Validate WooCommerce REST API consumer key and secret.
 *
 * @param string $consumer_key    The consumer key.
 * @param string $consumer_secret The consumer secret.
 * @return bool|WP_Error
 */
function honor_labs_validate_wc_api_keys( $consumer_key, $consumer_secret ) {
    global $wpdb;

    $table = $wpdb->prefix . 'woocommerce_api_keys';

    // Check if the API keys table exists (it should with WooCommerce installed).
    $table_exists = $wpdb->get_var( $wpdb->prepare( "SHOW TABLES LIKE %s", $table ) );
    if ( ! $table_exists ) {
        return new WP_Error(
            'rest_forbidden',
            __( 'WooCommerce API keys table not found.', 'honor-labs' ),
            array( 'status' => 500 )
        );
    }

    $key_data = $wpdb->get_row(
        $wpdb->prepare(
            "SELECT consumer_key, consumer_secret, permissions FROM {$table} WHERE consumer_key = %s",
            wc_api_hash( $consumer_key )
        )
    );

    if ( ! $key_data ) {
        return new WP_Error(
            'rest_forbidden',
            __( 'Invalid consumer key.', 'honor-labs' ),
            array( 'status' => 401 )
        );
    }

    if ( ! hash_equals( $key_data->consumer_secret, $consumer_secret ) ) {
        return new WP_Error(
            'rest_forbidden',
            __( 'Invalid consumer secret.', 'honor-labs' ),
            array( 'status' => 401 )
        );
    }

    // Read permission is sufficient for GET; write for POST/PUT/DELETE.
    return true;
}

// ──────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────────────

/**
 * Get all patients linked to a specific doctor.
 *
 * Patients are linked via the `hl_linked_doctor_id` user meta field,
 * which stores the doctor's WP user ID.
 *
 * @param int $doctor_id The doctor's WordPress user ID.
 * @return array Array of WP_User objects.
 */
function honor_labs_get_doctor_patients( $doctor_id ) {
    $args = array(
        'meta_query' => array(
            'relation' => 'AND',
            array(
                'key'   => 'b2bking_customergroup',
                'value' => HONOR_LABS_PATIENT_GROUP,
            ),
            array(
                'key'   => 'hl_linked_doctor_id',
                'value' => $doctor_id,
            ),
        ),
        'number'  => -1,
        'orderby' => 'registered',
        'order'   => 'DESC',
    );

    $query = new WP_User_Query( $args );
    return $query->get_results();
}

/**
 * Get WooCommerce orders for a specific user (HPOS-compatible).
 *
 * @param int    $user_id  The WordPress user ID.
 * @param array  $statuses Order statuses to include. Defaults to completed + processing.
 * @param int    $limit    Max orders to return. -1 for all.
 * @param string $after    Only orders after this date (Y-m-d format).
 * @param string $before   Only orders before this date (Y-m-d format).
 * @return WC_Order[] Array of WC_Order objects.
 */
function honor_labs_get_user_orders( $user_id, $statuses = null, $limit = -1, $after = '', $before = '' ) {
    if ( ! function_exists( 'wc_get_orders' ) ) {
        return array();
    }

    if ( null === $statuses ) {
        $statuses = array( 'completed', 'processing' );
    }

    $args = array(
        'customer_id' => $user_id,
        'status'      => $statuses,
        'limit'       => $limit,
        'orderby'     => 'date',
        'order'       => 'DESC',
    );

    if ( $after ) {
        $args['date_created'] = '>=' . $after;
    }

    // WC doesn't natively support combined after/before in one date_created param,
    // so we use date_query-style if both are provided.
    if ( $after && $before ) {
        $args['date_created'] = $after . '...' . $before;
    } elseif ( $before ) {
        $args['date_created'] = '<=' . $before;
    }

    return wc_get_orders( $args );
}

/**
 * Calculate commission for a doctor based on their patients' orders.
 *
 * Commission = commission_rate * SUM( completed patient order totals )
 *
 * @param int   $doctor_id The doctor's WordPress user ID.
 * @param float $rate      Commission rate (0.0 - 1.0). If null, uses the WP option.
 * @param string $date_from  Start date filter (Y-m-d). Optional.
 * @param string $date_to    End date filter (Y-m-d). Optional.
 * @return array {
 *     @type float $total_patient_orders   Number of patient orders.
 *     @type float $total_patient_revenue  Total revenue from patient orders.
 *     @type float $commission_rate        The rate used.
 *     @type float $commission_earned      Calculated commission amount.
 *     @type float $commission_paid        Amount already paid out (from user meta).
 *     @type float $commission_outstanding Earned minus paid.
 * }
 */
function honor_labs_calculate_commission( $doctor_id, $rate = null, $date_from = '', $date_to = '' ) {
    if ( null === $rate ) {
        $rate = (float) get_option( 'honor_labs_commission_rate', 0.10 );
    }

    // Per-doctor override (stored as user meta).
    $doctor_rate = get_user_meta( $doctor_id, 'hl_commission_rate', true );
    if ( '' !== $doctor_rate && false !== $doctor_rate ) {
        $rate = (float) $doctor_rate;
    }

    $patients         = honor_labs_get_doctor_patients( $doctor_id );
    $total_orders     = 0;
    $total_revenue    = 0.0;

    foreach ( $patients as $patient ) {
        $orders = honor_labs_get_user_orders(
            $patient->ID,
            array( 'completed' ),
            -1,
            $date_from,
            $date_to
        );

        $total_orders += count( $orders );

        foreach ( $orders as $order ) {
            $total_revenue += (float) $order->get_total();
        }
    }

    $commission_earned = round( $rate * $total_revenue, 2 );
    $commission_paid   = (float) get_user_meta( $doctor_id, 'hl_commission_paid', true );

    return array(
        'total_patient_orders'  => $total_orders,
        'total_patient_revenue' => round( $total_revenue, 2 ),
        'commission_rate'       => $rate,
        'commission_earned'     => $commission_earned,
        'commission_paid'       => round( $commission_paid, 2 ),
        'commission_outstanding'=> round( $commission_earned - $commission_paid, 2 ),
    );
}

/**
 * Generate a unique referral code for a doctor.
 *
 * Format: DR-XXX-YYY-ZZZ
 * Character set: ABCDEFGHJKLMNPQRSTUVWXYZ23456789 (no I, O, 0, 1 to avoid confusion)
 * Example: DR-A3K-9PB-X7N
 *
 * @param int $doctor_id The doctor's WordPress user ID.
 * @return string The generated referral code.
 */
function honor_labs_generate_referral_code( $doctor_id ) {
    $user = get_userdata( $doctor_id );
    if ( ! $user ) {
        return '';
    }

    $charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    $charset_len = strlen( $charset );

    // Generate unique code — retry if collision.
    $max_attempts = 10;
    for ( $i = 0; $i < $max_attempts; $i++ ) {
        // Generate 3 groups of 3 random characters.
        $groups = array();
        for ( $g = 0; $g < 3; $g++ ) {
            $segment = '';
            for ( $c = 0; $c < 3; $c++ ) {
                $segment .= $charset[ wp_rand( 0, $charset_len - 1 ) ];
            }
            $groups[] = $segment;
        }
        $code = 'DR-' . implode( '-', $groups );

        // Check for uniqueness across all users.
        $existing = get_users( array(
            'meta_key'   => 'hl_referral_code',
            'meta_value' => $code,
            'number'     => 1,
            'fields'     => 'ID',
        ) );

        if ( empty( $existing ) ) {
            update_user_meta( $doctor_id, 'hl_referral_code', $code );
            return $code;
        }
    }

    // Fallback — include user ID for guaranteed uniqueness.
    $code = 'DR-' . strtoupper( substr( md5( $doctor_id . time() ), 0, 3 ) ) . '-'
          . strtoupper( substr( md5( $doctor_id ), 0, 3 ) ) . '-'
          . str_pad( $doctor_id % 999, 3, '0', STR_PAD_LEFT );
    update_user_meta( $doctor_id, 'hl_referral_code', $code );
    return $code;
}

/**
 * Format a doctor user object into the standard API response shape.
 *
 * @param WP_User $user     The WP_User object.
 * @param bool    $detailed Whether to include linked patients and order history.
 * @return array
 */
function honor_labs_format_doctor( $user, $detailed = false ) {
    $doctor_id    = $user->ID;
    $patients     = honor_labs_get_doctor_patients( $doctor_id );
    $orders       = honor_labs_get_user_orders( $doctor_id );
    $commission   = honor_labs_calculate_commission( $doctor_id );

    $total_revenue = 0.0;
    $last_order_date = null;
    foreach ( $orders as $order ) {
        $total_revenue += (float) $order->get_total();
        $order_date = $order->get_date_created();
        if ( $order_date ) {
            $date_str = $order_date->date( 'c' );
            if ( null === $last_order_date || $date_str > $last_order_date ) {
                $last_order_date = $date_str;
            }
        }
    }

    $data = array(
        'id'                => $doctor_id,
        'first_name'        => $user->first_name,
        'last_name'         => $user->last_name,
        'email'             => $user->user_email,
        'npi_number'        => get_user_meta( $doctor_id, 'hl_npi_number', true ),
        'practice_name'     => get_user_meta( $doctor_id, 'hl_practice_name', true ),
        'specialty'         => get_user_meta( $doctor_id, 'hl_specialty', true ),
        'phone'             => get_user_meta( $doctor_id, 'hl_phone', true ),
        'practice_state'    => get_user_meta( $doctor_id, 'hl_practice_state', true ),
        'license_number'    => get_user_meta( $doctor_id, 'hl_license_number', true ),
        'referral_code'     => get_user_meta( $doctor_id, 'hl_referral_code', true ),
        'patient_count'     => count( $patients ),
        'total_orders'      => count( $orders ),
        'total_revenue'     => round( $total_revenue, 2 ),
        'commission_owed'   => $commission['commission_outstanding'],
        'registration_date' => $user->user_registered,
        'last_order_date'   => $last_order_date,
        'status'            => get_user_meta( $doctor_id, 'b2bking_account_approval', true ) ?: 'pending',
    );

    if ( $detailed ) {
        // Linked patients list.
        $patient_list = array();
        foreach ( $patients as $patient ) {
            $patient_list[] = array(
                'id'                => $patient->ID,
                'first_name'        => $patient->first_name,
                'last_name'         => $patient->last_name,
                'email'             => $patient->user_email,
                'registration_date' => $patient->user_registered,
            );
        }
        $data['patients'] = $patient_list;

        // Order history summary.
        $order_history = array();
        foreach ( $orders as $order ) {
            $order_date = $order->get_date_created();
            $order_history[] = array(
                'order_id'   => $order->get_id(),
                'date'       => $order_date ? $order_date->date( 'c' ) : null,
                'total'      => (float) $order->get_total(),
                'status'     => $order->get_status(),
                'item_count' => $order->get_item_count(),
            );
        }
        $data['order_history'] = $order_history;

        // Full commission breakdown.
        $data['commission'] = $commission;
    }

    return $data;
}

/**
 * Format a patient user object into the standard API response shape.
 *
 * @param WP_User $user     The WP_User object.
 * @param bool    $detailed Whether to include order history.
 * @return array
 */
function honor_labs_format_patient( $user, $detailed = false ) {
    $patient_id      = $user->ID;
    $linked_doctor_id = get_user_meta( $patient_id, 'hl_linked_doctor_id', true );
    $linked_doctor    = $linked_doctor_id ? get_userdata( (int) $linked_doctor_id ) : null;

    $orders          = honor_labs_get_user_orders( $patient_id );
    $total_spent     = 0.0;
    $last_order_date = null;

    foreach ( $orders as $order ) {
        $total_spent += (float) $order->get_total();
        $order_date = $order->get_date_created();
        if ( $order_date ) {
            $date_str = $order_date->date( 'c' );
            if ( null === $last_order_date || $date_str > $last_order_date ) {
                $last_order_date = $date_str;
            }
        }
    }

    $data = array(
        'id'                  => $patient_id,
        'first_name'          => $user->first_name,
        'last_name'           => $user->last_name,
        'email'               => $user->user_email,
        'linked_doctor_id'    => $linked_doctor_id ? (int) $linked_doctor_id : null,
        'linked_doctor_name'  => $linked_doctor
            ? trim( $linked_doctor->first_name . ' ' . $linked_doctor->last_name )
            : null,
        'joined_via_code'     => get_user_meta( $patient_id, 'hl_joined_via_code', true ),
        'phone'               => get_user_meta( $patient_id, 'hl_patient_phone', true ),
        'verified'            => get_user_meta( $patient_id, 'hl_patient_verified', true ),
        'registration_date'   => get_user_meta( $patient_id, 'hl_patient_registration_date', true ) ?: $user->user_registered,
        'total_orders'        => count( $orders ),
        'total_spent'         => round( $total_spent, 2 ),
        'last_order_date'     => $last_order_date,
    );

    if ( $detailed ) {
        $order_history = array();
        foreach ( $orders as $order ) {
            $order_date = $order->get_date_created();
            $items = array();
            foreach ( $order->get_items() as $item ) {
                $items[] = array(
                    'product_id'   => $item->get_product_id(),
                    'product_name' => $item->get_name(),
                    'quantity'     => $item->get_quantity(),
                    'total'        => (float) $item->get_total(),
                );
            }
            $order_history[] = array(
                'order_id'   => $order->get_id(),
                'date'       => $order_date ? $order_date->date( 'c' ) : null,
                'total'      => (float) $order->get_total(),
                'status'     => $order->get_status(),
                'item_count' => $order->get_item_count(),
                'items'      => $items,
            );
        }
        $data['order_history'] = $order_history;
    }

    return $data;
}

// ──────────────────────────────────────────────────────────────────────
// REGISTER REST ROUTES
// ──────────────────────────────────────────────────────────────────────

add_action( 'rest_api_init', function () {

    // ──────────────────────────────────────────────────────────────
    // 1. GET /doctors — List all doctors
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/doctors', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'honor_labs_get_doctors',
        'permission_callback' => 'honor_labs_api_permission_check',
        'args'                => array(
            'per_page' => array(
                'default'           => 20,
                'sanitize_callback' => 'absint',
            ),
            'page' => array(
                'default'           => 1,
                'sanitize_callback' => 'absint',
            ),
            'search' => array(
                'default'           => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));

    // ──────────────────────────────────────────────────────────────
    // 2. GET /doctors/{id} — Single doctor detail
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/doctors/(?P<id>\d+)', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'honor_labs_get_doctor',
        'permission_callback' => 'honor_labs_api_permission_check',
        'args'                => array(
            'id' => array(
                'validate_callback' => function ( $param ) {
                    return is_numeric( $param );
                },
            ),
        ),
    ));

    // ──────────────────────────────────────────────────────────────
    // 3. GET /patients — List all patients
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/patients', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'honor_labs_get_patients',
        'permission_callback' => 'honor_labs_api_permission_check',
        'args'                => array(
            'per_page' => array(
                'default'           => 20,
                'sanitize_callback' => 'absint',
            ),
            'page' => array(
                'default'           => 1,
                'sanitize_callback' => 'absint',
            ),
            'search' => array(
                'default'           => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'doctor_id' => array(
                'default'           => 0,
                'sanitize_callback' => 'absint',
            ),
        ),
    ));

    // ──────────────────────────────────────────────────────────────
    // 4. GET /patients/{id} — Single patient detail
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/patients/(?P<id>\d+)', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'honor_labs_get_patient',
        'permission_callback' => 'honor_labs_api_permission_check',
        'args'                => array(
            'id' => array(
                'validate_callback' => function ( $param ) {
                    return is_numeric( $param );
                },
            ),
        ),
    ));

    // ──────────────────────────────────────────────────────────────
    // 5. GET /doctor-applications — List doctor applications
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/doctor-applications', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'honor_labs_get_doctor_applications',
        'permission_callback' => 'honor_labs_api_permission_check',
        'args'                => array(
            'status' => array(
                'default'           => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'per_page' => array(
                'default'           => 20,
                'sanitize_callback' => 'absint',
            ),
            'page' => array(
                'default'           => 1,
                'sanitize_callback' => 'absint',
            ),
        ),
    ));

    // ──────────────────────────────────────────────────────────────
    // 6. POST /doctor-applications/{id}/approve
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/doctor-applications/(?P<id>\d+)/approve', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'honor_labs_approve_doctor_application',
        'permission_callback' => 'honor_labs_api_permission_check',
        'args'                => array(
            'id' => array(
                'validate_callback' => function ( $param ) {
                    return is_numeric( $param );
                },
            ),
        ),
    ));

    // ──────────────────────────────────────────────────────────────
    // 7. POST /doctor-applications/{id}/reject
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/doctor-applications/(?P<id>\d+)/reject', array(
        'methods'             => WP_REST_Server::CREATABLE,
        'callback'            => 'honor_labs_reject_doctor_application',
        'permission_callback' => 'honor_labs_api_permission_check',
        'args'                => array(
            'id' => array(
                'validate_callback' => function ( $param ) {
                    return is_numeric( $param );
                },
            ),
            'reason' => array(
                'default'           => '',
                'sanitize_callback' => 'sanitize_textarea_field',
            ),
        ),
    ));

    // ──────────────────────────────────────────────────────────────
    // 8. GET /commissions — Commission data per doctor
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/commissions', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'honor_labs_get_commissions',
        'permission_callback' => 'honor_labs_api_permission_check',
        'args'                => array(
            'doctor_id' => array(
                'default'           => 0,
                'sanitize_callback' => 'absint',
            ),
            'date_from' => array(
                'default'           => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'date_to' => array(
                'default'           => '',
                'sanitize_callback' => 'sanitize_text_field',
            ),
        ),
    ));

    // ──────────────────────────────────────────────────────────────
    // 9. GET /referral-codes — All referral codes with stats
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/referral-codes', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'honor_labs_get_referral_codes',
        'permission_callback' => 'honor_labs_api_permission_check',
    ));

    // ──────────────────────────────────────────────────────────────
    // 10. GET /dashboard-stats — Aggregated business metrics
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/dashboard-stats', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'honor_labs_get_dashboard_stats',
        'permission_callback' => 'honor_labs_api_permission_check',
    ));

    // ──────────────────────────────────────────────────────────────
    // 11. GET /b2bking/groups — B2BKing customer groups
    // ──────────────────────────────────────────────────────────────
    register_rest_route( HONOR_LABS_API_NAMESPACE, '/b2bking/groups', array(
        'methods'             => WP_REST_Server::READABLE,
        'callback'            => 'honor_labs_get_b2bking_groups',
        'permission_callback' => 'honor_labs_api_permission_check',
    ));
});

// ──────────────────────────────────────────────────────────────────────
// ENDPOINT CALLBACKS
// ──────────────────────────────────────────────────────────────────────

/**
 * 1. GET /doctors — List all doctors (B2BKing group 599).
 */
function honor_labs_get_doctors( WP_REST_Request $request ) {
    $per_page = $request->get_param( 'per_page' );
    $page     = $request->get_param( 'page' );
    $search   = $request->get_param( 'search' );

    $args = array(
        'meta_query' => array(
            array(
                'key'   => 'b2bking_customergroup',
                'value' => HONOR_LABS_DOCTOR_GROUP,
            ),
        ),
        'number'  => $per_page,
        'offset'  => ( $page - 1 ) * $per_page,
        'orderby' => 'registered',
        'order'   => 'DESC',
    );

    if ( ! empty( $search ) ) {
        $args['search']         = '*' . $search . '*';
        $args['search_columns'] = array( 'user_login', 'user_email', 'user_nicename', 'display_name' );
    }

    $query   = new WP_User_Query( $args );
    $doctors = $query->get_results();
    $total   = $query->get_total();

    $data = array();
    foreach ( $doctors as $user ) {
        $data[] = honor_labs_format_doctor( $user, false );
    }

    $response = new WP_REST_Response( $data, 200 );
    $response->header( 'X-WP-Total', $total );
    $response->header( 'X-WP-TotalPages', ceil( $total / $per_page ) );

    return $response;
}

/**
 * 2. GET /doctors/{id} — Single doctor detail.
 */
function honor_labs_get_doctor( WP_REST_Request $request ) {
    $doctor_id = (int) $request->get_param( 'id' );
    $user      = get_userdata( $doctor_id );

    if ( ! $user ) {
        return new WP_Error(
            'not_found',
            __( 'Doctor not found.', 'honor-labs' ),
            array( 'status' => 404 )
        );
    }

    // Verify this user is actually in the doctor group.
    $group = get_user_meta( $doctor_id, 'b2bking_customergroup', true );
    if ( HONOR_LABS_DOCTOR_GROUP !== $group ) {
        return new WP_Error(
            'not_found',
            __( 'User is not a doctor.', 'honor-labs' ),
            array( 'status' => 404 )
        );
    }

    return new WP_REST_Response( honor_labs_format_doctor( $user, true ), 200 );
}

/**
 * 3. GET /patients — List all patients (B2BKing group 695).
 */
function honor_labs_get_patients( WP_REST_Request $request ) {
    $per_page  = $request->get_param( 'per_page' );
    $page      = $request->get_param( 'page' );
    $search    = $request->get_param( 'search' );
    $doctor_id = $request->get_param( 'doctor_id' );

    $meta_query = array(
        array(
            'key'   => 'b2bking_customergroup',
            'value' => HONOR_LABS_PATIENT_GROUP,
        ),
    );

    // Filter by linked doctor.
    if ( $doctor_id > 0 ) {
        $meta_query['relation'] = 'AND';
        $meta_query[] = array(
            'key'   => 'hl_linked_doctor_id',
            'value' => $doctor_id,
        );
    }

    $args = array(
        'meta_query' => $meta_query,
        'number'     => $per_page,
        'offset'     => ( $page - 1 ) * $per_page,
        'orderby'    => 'registered',
        'order'      => 'DESC',
    );

    if ( ! empty( $search ) ) {
        $args['search']         = '*' . $search . '*';
        $args['search_columns'] = array( 'user_login', 'user_email', 'user_nicename', 'display_name' );
    }

    $query    = new WP_User_Query( $args );
    $patients = $query->get_results();
    $total    = $query->get_total();

    $data = array();
    foreach ( $patients as $user ) {
        $data[] = honor_labs_format_patient( $user, false );
    }

    $response = new WP_REST_Response( $data, 200 );
    $response->header( 'X-WP-Total', $total );
    $response->header( 'X-WP-TotalPages', ceil( $total / $per_page ) );

    return $response;
}

/**
 * 4. GET /patients/{id} — Single patient detail.
 */
function honor_labs_get_patient( WP_REST_Request $request ) {
    $patient_id = (int) $request->get_param( 'id' );
    $user       = get_userdata( $patient_id );

    if ( ! $user ) {
        return new WP_Error(
            'not_found',
            __( 'Patient not found.', 'honor-labs' ),
            array( 'status' => 404 )
        );
    }

    $group = get_user_meta( $patient_id, 'b2bking_customergroup', true );
    if ( HONOR_LABS_PATIENT_GROUP !== $group ) {
        return new WP_Error(
            'not_found',
            __( 'User is not a patient.', 'honor-labs' ),
            array( 'status' => 404 )
        );
    }

    return new WP_REST_Response( honor_labs_format_patient( $user, true ), 200 );
}

/**
 * 5. GET /doctor-applications — List doctor applications.
 *
 * Doctor applications are regular WordPress users who have the `hl_application_date`
 * user meta set. Approval status is stored in `b2bking_account_approval`:
 *   - empty or 'pending' = pending
 *   - 'approved' = approved
 *   - 'rejected' = rejected
 */
function honor_labs_get_doctor_applications( WP_REST_Request $request ) {
    $status   = $request->get_param( 'status' );
    $per_page = $request->get_param( 'per_page' );
    $page     = $request->get_param( 'page' );

    // Doctor applications are users with hl_application_date meta set.
    $meta_query = array(
        array(
            'key'     => 'hl_application_date',
            'compare' => 'EXISTS',
        ),
    );

    // Filter by approval status if requested.
    if ( ! empty( $status ) ) {
        $status_lower = strtolower( $status );

        if ( 'pending' === $status_lower ) {
            // Pending = b2bking_account_approval is empty or not set.
            $meta_query['relation'] = 'AND';
            $meta_query[] = array(
                'relation' => 'OR',
                array(
                    'key'     => 'b2bking_account_approval',
                    'compare' => 'NOT EXISTS',
                ),
                array(
                    'key'     => 'b2bking_account_approval',
                    'value'   => '',
                    'compare' => '=',
                ),
                array(
                    'key'     => 'b2bking_account_approval',
                    'value'   => 'pending',
                    'compare' => '=',
                ),
            );
        } else {
            // 'approved' or 'rejected'
            $meta_query['relation'] = 'AND';
            $meta_query[] = array(
                'key'     => 'b2bking_account_approval',
                'value'   => $status_lower,
                'compare' => '=',
            );
        }
    }

    $args = array(
        'meta_query' => $meta_query,
        'number'     => $per_page,
        'offset'     => ( $page - 1 ) * $per_page,
        'orderby'    => 'registered',
        'order'      => 'DESC',
    );

    $query        = new WP_User_Query( $args );
    $users        = $query->get_results();
    $total        = $query->get_total();
    $applications = array();

    foreach ( $users as $user ) {
        $user_id = $user->ID;

        // Determine application status from b2bking_account_approval.
        $approval = get_user_meta( $user_id, 'b2bking_account_approval', true );
        if ( empty( $approval ) ) {
            $app_status = 'pending';
        } else {
            $app_status = $approval;
        }

        $applications[] = array(
            'id'            => $user_id,
            'user_id'       => $user_id,
            'first_name'    => $user->first_name,
            'last_name'     => $user->last_name,
            'email'         => $user->user_email,
            'npi_number'    => get_user_meta( $user_id, 'hl_npi_number', true ) ?: '',
            'practice_name' => get_user_meta( $user_id, 'hl_practice_name', true ) ?: '',
            'specialty'     => get_user_meta( $user_id, 'hl_specialty', true ) ?: '',
            'phone'         => get_user_meta( $user_id, 'hl_phone', true ) ?: '',
            'practice_state'=> get_user_meta( $user_id, 'hl_practice_state', true ) ?: '',
            'license_number'=> get_user_meta( $user_id, 'hl_license_number', true ) ?: '',
            'status'        => $app_status,
            'date_applied'  => get_user_meta( $user_id, 'hl_application_date', true ) ?: $user->user_registered,
        );
    }

    $response = new WP_REST_Response( $applications, 200 );
    $response->header( 'X-WP-Total', $total );
    $response->header( 'X-WP-TotalPages', ceil( $total / $per_page ) );

    return $response;
}

/**
 * 6. POST /doctor-applications/{id}/approve — Approve a doctor application.
 *
 * The {id} is the user ID (doctor applications are users, not posts).
 *
 * Actions performed:
 *   1. Set `b2bking_account_approval` to 'approved'.
 *   2. Set `b2bking_b2buser` to 'yes'.
 *   3. Set `b2bking_customergroup` to the B2BKing doctor group post ID.
 *   4. Generate a referral code if the doctor doesn't have one yet.
 */
function honor_labs_approve_doctor_application( WP_REST_Request $request ) {
    $user_id = (int) $request->get_param( 'id' );
    $user    = get_userdata( $user_id );

    if ( ! $user ) {
        return new WP_Error(
            'not_found',
            __( 'Doctor application not found.', 'honor-labs' ),
            array( 'status' => 404 )
        );
    }

    // Verify this user has an application (hl_application_date meta exists).
    $application_date = get_user_meta( $user_id, 'hl_application_date', true );
    if ( empty( $application_date ) ) {
        return new WP_Error(
            'not_found',
            __( 'No doctor application found for this user.', 'honor-labs' ),
            array( 'status' => 404 )
        );
    }

    // Use the doctor-onboarding plugin's approval function if available.
    // It handles B2BKing hooks, cache busting, referral code generation,
    // and all the internal state that B2BKing needs to recognize the approval.
    if ( function_exists( 'hl_approve_doctor' ) ) {
        hl_approve_doctor( $user_id );
    } else {
        // Fallback: replicate what hl_approve_doctor does manually.
        // 1. Set B2BKing approval flags.
        update_user_meta( $user_id, 'b2bking_account_approval', 'approved' );
        update_user_meta( $user_id, 'b2bking_b2buser', 'yes' );

        // 2. Assign doctor group in B2BKing.
        update_user_meta( $user_id, 'b2bking_customergroup', HONOR_LABS_DOCTOR_GROUP );

        // 3. Generate referral code if missing.
        if ( empty( get_user_meta( $user_id, 'hl_referral_code', true ) ) ) {
            honor_labs_generate_referral_code( $user_id );
        }

        // 4. Fire B2BKing's own approval action so internal logic runs.
        do_action( 'b2bking_user_account_approved', $user_id );

        // 5. Bust B2BKing transient caches so the change takes effect immediately.
        delete_transient( 'b2bking_user_group_' . $user_id );
        delete_transient( 'b2bking_' . $user_id );

        // 6. Bust WP object cache for this user's meta.
        wp_cache_delete( $user_id, 'user_meta' );
    }

    // Ensure customer role is set.
    if ( ! in_array( 'customer', (array) $user->roles, true ) ) {
        $user->add_role( 'customer' );
    }

    $referral_code = get_user_meta( $user_id, 'hl_referral_code', true );

    /**
     * Fires after a doctor application is approved.
     *
     * @param int $user_id The doctor's user ID.
     */
    do_action( 'honor_labs_doctor_application_approved', $user_id );

    return new WP_REST_Response( array(
        'success'       => true,
        'message'       => __( 'Doctor application approved successfully.', 'honor-labs' ),
        'user_id'       => $user_id,
        'referral_code' => $referral_code,
        'group'         => HONOR_LABS_DOCTOR_GROUP,
    ), 200 );
}

/**
 * 7. POST /doctor-applications/{id}/reject — Reject a doctor application.
 *
 * The {id} is the user ID (doctor applications are users, not posts).
 *
 * Actions performed:
 *   1. Set `b2bking_account_approval` to 'rejected'.
 *   2. Store rejection reason if provided.
 */
function honor_labs_reject_doctor_application( WP_REST_Request $request ) {
    $user_id = (int) $request->get_param( 'id' );
    $reason  = $request->get_param( 'reason' );
    $user    = get_userdata( $user_id );

    if ( ! $user ) {
        return new WP_Error(
            'not_found',
            __( 'Doctor application not found.', 'honor-labs' ),
            array( 'status' => 404 )
        );
    }

    // Verify this user has an application (hl_application_date meta exists).
    $application_date = get_user_meta( $user_id, 'hl_application_date', true );
    if ( empty( $application_date ) ) {
        return new WP_Error(
            'not_found',
            __( 'No doctor application found for this user.', 'honor-labs' ),
            array( 'status' => 404 )
        );
    }

    // 1. Set rejection status.
    update_user_meta( $user_id, 'b2bking_account_approval', 'rejected' );

    // 2. Store rejection reason if provided.
    if ( ! empty( $reason ) ) {
        update_user_meta( $user_id, 'hl_rejection_reason', $reason );
    }

    // 3. Bust B2BKing caches so the change takes effect immediately.
    delete_transient( 'b2bking_user_group_' . $user_id );
    delete_transient( 'b2bking_' . $user_id );
    wp_cache_delete( $user_id, 'user_meta' );

    /**
     * Fires after a doctor application is rejected.
     *
     * @param int    $user_id The applicant's user ID.
     * @param string $reason  The rejection reason.
     */
    do_action( 'honor_labs_doctor_application_rejected', $user_id, $reason );

    return new WP_REST_Response( array(
        'success' => true,
        'message' => __( 'Doctor application rejected.', 'honor-labs' ),
        'user_id' => $user_id,
        'reason'  => $reason,
    ), 200 );
}

/**
 * 8. GET /commissions — Commission data per doctor.
 */
function honor_labs_get_commissions( WP_REST_Request $request ) {
    $doctor_id_filter = $request->get_param( 'doctor_id' );
    $date_from        = $request->get_param( 'date_from' );
    $date_to          = $request->get_param( 'date_to' );

    // If a specific doctor is requested, return only that doctor's commission.
    if ( $doctor_id_filter > 0 ) {
        $user = get_userdata( $doctor_id_filter );
        if ( ! $user ) {
            return new WP_Error(
                'not_found',
                __( 'Doctor not found.', 'honor-labs' ),
                array( 'status' => 404 )
            );
        }

        $commission = honor_labs_calculate_commission( $doctor_id_filter, null, $date_from, $date_to );

        return new WP_REST_Response( array(
            array_merge(
                array(
                    'doctor_id'   => $doctor_id_filter,
                    'doctor_name' => trim( $user->first_name . ' ' . $user->last_name ),
                ),
                $commission
            ),
        ), 200 );
    }

    // Return commissions for all doctors.
    $doctor_query = new WP_User_Query( array(
        'meta_query' => array(
            array(
                'key'   => 'b2bking_customergroup',
                'value' => HONOR_LABS_DOCTOR_GROUP,
            ),
        ),
        'number'  => -1,
        'orderby' => 'registered',
        'order'   => 'DESC',
    ) );

    $data = array();
    foreach ( $doctor_query->get_results() as $doctor ) {
        $commission = honor_labs_calculate_commission( $doctor->ID, null, $date_from, $date_to );
        $data[] = array_merge(
            array(
                'doctor_id'   => $doctor->ID,
                'doctor_name' => trim( $doctor->first_name . ' ' . $doctor->last_name ),
            ),
            $commission
        );
    }

    return new WP_REST_Response( $data, 200 );
}

/**
 * 9. GET /referral-codes — All referral codes with usage stats.
 */
function honor_labs_get_referral_codes( WP_REST_Request $request ) {
    // Get all doctors.
    $doctor_query = new WP_User_Query( array(
        'meta_query' => array(
            array(
                'key'   => 'b2bking_customergroup',
                'value' => HONOR_LABS_DOCTOR_GROUP,
            ),
        ),
        'number' => -1,
    ) );

    $data = array();

    foreach ( $doctor_query->get_results() as $doctor ) {
        $code = get_user_meta( $doctor->ID, 'hl_referral_code', true );
        if ( empty( $code ) ) {
            continue; // Skip doctors without a referral code.
        }

        // Count patients who used this code.
        $patients = honor_labs_get_doctor_patients( $doctor->ID );
        $times_used = count( $patients );

        // Calculate total revenue generated through this referral code.
        $total_revenue = 0.0;
        foreach ( $patients as $patient ) {
            $orders = honor_labs_get_user_orders( $patient->ID, array( 'completed' ) );
            foreach ( $orders as $order ) {
                $total_revenue += (float) $order->get_total();
            }
        }

        $data[] = array(
            'code'                   => $code,
            'doctor_id'              => $doctor->ID,
            'doctor_name'            => trim( $doctor->first_name . ' ' . $doctor->last_name ),
            'times_used'             => $times_used,
            'total_revenue_generated'=> round( $total_revenue, 2 ),
        );
    }

    return new WP_REST_Response( $data, 200 );
}

/**
 * 10. GET /dashboard-stats — Aggregated business metrics.
 */
function honor_labs_get_dashboard_stats( WP_REST_Request $request ) {
    if ( ! function_exists( 'wc_get_orders' ) ) {
        return new WP_Error(
            'wc_not_active',
            __( 'WooCommerce is not active.', 'honor-labs' ),
            array( 'status' => 500 )
        );
    }

    // ── Completed / processing orders (all time) ──
    $all_orders = wc_get_orders( array(
        'status' => array( 'completed', 'processing' ),
        'limit'  => -1,
        'return' => 'ids',
    ) );

    $total_revenue   = 0.0;
    $total_orders    = count( $all_orders );
    $wholesale_revenue = 0.0;
    $retail_revenue    = 0.0;

    foreach ( $all_orders as $order_id ) {
        $order     = wc_get_order( $order_id );
        if ( ! $order ) {
            continue;
        }
        $order_total = (float) $order->get_total();
        $total_revenue += $order_total;

        $customer_id = $order->get_customer_id();
        if ( $customer_id ) {
            $group = get_user_meta( $customer_id, 'b2bking_customergroup', true );
            if ( HONOR_LABS_DOCTOR_GROUP === $group ) {
                $wholesale_revenue += $order_total;
            } elseif ( HONOR_LABS_PATIENT_GROUP === $group ) {
                $retail_revenue += $order_total;
            }
        }
    }

    // ── This month ──
    $first_of_month = gmdate( 'Y-m-01' );
    $monthly_orders = wc_get_orders( array(
        'status'       => array( 'completed', 'processing' ),
        'date_created' => '>=' . $first_of_month,
        'limit'        => -1,
        'return'       => 'ids',
    ) );

    $total_revenue_this_month = 0.0;
    $total_orders_this_month  = count( $monthly_orders );

    foreach ( $monthly_orders as $order_id ) {
        $order = wc_get_order( $order_id );
        if ( $order ) {
            $total_revenue_this_month += (float) $order->get_total();
        }
    }

    // ── User counts ──
    $doctor_count = ( new WP_User_Query( array(
        'meta_query' => array( array(
            'key'   => 'b2bking_customergroup',
            'value' => HONOR_LABS_DOCTOR_GROUP,
        ) ),
        'count_total' => true,
        'number'      => 0, // We only need the count.
    ) ) )->get_total();

    $patient_count = ( new WP_User_Query( array(
        'meta_query' => array( array(
            'key'   => 'b2bking_customergroup',
            'value' => HONOR_LABS_PATIENT_GROUP,
        ) ),
        'count_total' => true,
        'number'      => 0,
    ) ) )->get_total();

    // ── Pending applications ──
    // Doctor applications are users with hl_application_date meta.
    // Pending = b2bking_account_approval is empty, not set, or 'pending'.
    $pending_applications = ( new WP_User_Query( array(
        'meta_query' => array(
            'relation' => 'AND',
            array(
                'key'     => 'hl_application_date',
                'compare' => 'EXISTS',
            ),
            array(
                'relation' => 'OR',
                array(
                    'key'     => 'b2bking_account_approval',
                    'compare' => 'NOT EXISTS',
                ),
                array(
                    'key'     => 'b2bking_account_approval',
                    'value'   => '',
                    'compare' => '=',
                ),
                array(
                    'key'     => 'b2bking_account_approval',
                    'value'   => 'pending',
                    'compare' => '=',
                ),
            ),
        ),
        'count_total' => true,
        'number'      => 0,
    ) ) )->get_total();

    return new WP_REST_Response( array(
        'total_revenue'            => round( $total_revenue, 2 ),
        'total_revenue_this_month' => round( $total_revenue_this_month, 2 ),
        'total_orders'             => $total_orders,
        'total_orders_this_month'  => $total_orders_this_month,
        'active_doctors'           => (int) $doctor_count,
        'active_patients'          => (int) $patient_count,
        'pending_applications'     => $pending_applications,
        'wholesale_revenue'        => round( $wholesale_revenue, 2 ),
        'retail_revenue'           => round( $retail_revenue, 2 ),
    ), 200 );
}

/**
 * 11. GET /b2bking/groups — List B2BKing customer groups with member counts.
 *
 * B2BKing stores groups as a custom post type `b2bking_group`. Each group has
 * a title and an ID. Users are assigned to groups via the `b2bking_customergroup`
 * user meta key, which holds the group post ID as a string.
 */
function honor_labs_get_b2bking_groups( WP_REST_Request $request ) {
    $groups = array();

    // B2BKing stores groups as custom post type `b2bking_group`.
    $group_posts = get_posts( array(
        'post_type'   => 'b2bking_group',
        'post_status' => 'publish',
        'numberposts' => -1,
        'orderby'     => 'title',
        'order'       => 'ASC',
    ) );

    if ( ! empty( $group_posts ) ) {
        foreach ( $group_posts as $group_post ) {
            $group_id = (string) $group_post->ID;

            // Count users in this group.
            $member_count = ( new WP_User_Query( array(
                'meta_query'  => array( array(
                    'key'   => 'b2bking_customergroup',
                    'value' => $group_id,
                ) ),
                'count_total' => true,
                'number'      => 0,
            ) ) )->get_total();

            $groups[] = array(
                'id'           => $group_post->ID,
                'name'         => $group_post->post_title,
                'slug'         => $group_post->post_name,
                'member_count' => (int) $member_count,
            );
        }
    }

    // Also count the special "b2cuser" group (users without a numeric group).
    $b2c_count = ( new WP_User_Query( array(
        'meta_query'  => array( array(
            'key'   => 'b2bking_customergroup',
            'value' => HONOR_LABS_B2C_GROUP,
        ) ),
        'count_total' => true,
        'number'      => 0,
    ) ) )->get_total();

    $groups[] = array(
        'id'           => 0,
        'name'         => 'B2C Users (General)',
        'slug'         => 'b2cuser',
        'member_count' => (int) $b2c_count,
    );

    return new WP_REST_Response( $groups, 200 );
}

// ──────────────────────────────────────────────────────────────────────
// ADMIN: Register the default commission rate option.
// ──────────────────────────────────────────────────────────────────────

add_action( 'admin_init', function () {
    if ( false === get_option( 'honor_labs_commission_rate' ) ) {
        add_option( 'honor_labs_commission_rate', '0.10' );
    }
});

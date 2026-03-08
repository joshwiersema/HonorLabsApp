<?php
/**
 * Plugin Name: Honor Labs Patient Portal
 * Plugin URI: https://honorlabs.com/patient-portal
 * Description: Handles patient registration, referral code validation, and doctor-patient linking for Honor Labs B2B/B2C marketplace
 * Version: 1.0.0
 * Author: Honor Labs
 * Author URI: https://honorlabs.com
 * License: GPL-2.0-or-later
 * Text Domain: honor-labs-patient-portal
 * Domain Path: /languages
 */

defined( 'ABSPATH' ) || exit;

// Define plugin constants
define( 'HLPP_PLUGIN_FILE', __FILE__ );
define( 'HLPP_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'HLPP_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'HLPP_VERSION', '1.0.0' );

/**
 * Main plugin class
 */
class Honor_Labs_Patient_Portal {

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->init_hooks();
	}

	/**
	 * Initialize hooks
	 */
	private function init_hooks() {
		// Plugin lifecycle
		register_activation_hook( HLPP_PLUGIN_FILE, array( $this, 'activate' ) );
		register_deactivation_hook( HLPP_PLUGIN_FILE, array( $this, 'deactivate' ) );

		// Frontend
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'woocommerce_register_form', array( $this, 'add_patient_registration_form' ) );
		add_filter( 'woocommerce_process_registration_errors', array( $this, 'validate_patient_registration' ), 10, 4 );
		add_action( 'woocommerce_created_customer', array( $this, 'save_patient_data' ), 10, 1 );

		// AJAX
		add_action( 'wp_ajax_nopriv_hlpp_validate_referral_code', array( $this, 'ajax_validate_referral_code' ) );
		add_action( 'wp_ajax_hlpp_validate_referral_code', array( $this, 'ajax_validate_referral_code' ) );

		// Cron
		add_action( 'hlpp_daily_churn_check', array( $this, 'run_daily_churn_check' ) );
		add_action( 'hlpp_grace_period_check', array( $this, 'run_grace_period_check' ) );
	}

	/**
	 * Plugin activation
	 */
	public function activate() {
		// Set default option if not exists
		if ( ! get_option( 'honor_labs_churn_threshold_days' ) ) {
			update_option( 'honor_labs_churn_threshold_days', 90 );
		}

		if ( ! get_option( 'honor_labs_grace_period_days' ) ) {
			update_option( 'honor_labs_grace_period_days', 14 );
		}

		// Schedule cron events
		if ( ! wp_next_scheduled( 'hlpp_daily_churn_check' ) ) {
			wp_schedule_event( time(), 'daily', 'hlpp_daily_churn_check' );
		}

		if ( ! wp_next_scheduled( 'hlpp_grace_period_check' ) ) {
			wp_schedule_event( time(), 'daily', 'hlpp_grace_period_check' );
		}

		// Ensure Patients group exists
		hlpp_get_or_create_patients_group();
	}

	/**
	 * Plugin deactivation
	 */
	public function deactivate() {
		// Clear cron events
		wp_clear_scheduled_hook( 'hlpp_daily_churn_check' );
		wp_clear_scheduled_hook( 'hlpp_grace_period_check' );
	}

	/**
	 * Enqueue scripts and styles
	 */
	public function enqueue_scripts() {
		if ( is_page() && function_exists( 'is_account_page' ) && is_account_page() ) {
			wp_enqueue_style(
				'hlpp-styles',
				HLPP_PLUGIN_URL . 'css/patient-portal.css',
				array(),
				HLPP_VERSION
			);

			wp_enqueue_script(
				'hlpp-scripts',
				HLPP_PLUGIN_URL . 'js/patient-portal.js',
				array( 'jquery' ),
				HLPP_VERSION,
				true
			);

			wp_localize_script(
				'hlpp-scripts',
				'hlppData',
				array(
					'ajaxurl' => admin_url( 'admin-ajax.php' ),
					'nonce'   => wp_create_nonce( 'hlpp_validate_referral_code_nonce' ),
				)
			);
		}
	}

	/**
	 * Add patient registration form to WooCommerce register form
	 */
	public function add_patient_registration_form() {
		// Output the tab navigation and form
		?>
		<div id="hlpp-registration-tabs">
			<ul class="hlpp-tabs-list">
				<li><a href="#" class="hlpp-tab-trigger" data-tab="doctor" style="display:none;">I'm a Doctor</a></li>
				<li><a href="#" class="hlpp-tab-trigger" data-tab="patient">I'm a Patient</a></li>
			</ul>
		</div>

		<div id="hlpp-patient-form-wrapper" class="hlpp-registration-fields">
			<input type="hidden" name="hl_registration_type" id="hl_registration_type" value="patient" />

			<?php do_action( 'hlpp_before_patient_fields' ); ?>

			<p class="form-row form-row-first">
				<label for="hlpp_first_name"><?php esc_html_e( 'First Name', 'honor-labs-patient-portal' ); ?> <span class="required">*</span></label>
				<input type="text" class="input-text" name="hlpp_first_name" id="hlpp_first_name" value="<?php echo isset( $_POST['hlpp_first_name'] ) ? esc_attr( sanitize_text_field( wp_unslash( $_POST['hlpp_first_name'] ) ) ) : ''; ?>" />
			</p>

			<p class="form-row form-row-last">
				<label for="hlpp_last_name"><?php esc_html_e( 'Last Name', 'honor-labs-patient-portal' ); ?> <span class="required">*</span></label>
				<input type="text" class="input-text" name="hlpp_last_name" id="hlpp_last_name" value="<?php echo isset( $_POST['hlpp_last_name'] ) ? esc_attr( sanitize_text_field( wp_unslash( $_POST['hlpp_last_name'] ) ) ) : ''; ?>" />
			</p>

			<p class="form-row form-row-wide">
				<label for="hlpp_phone"><?php esc_html_e( 'Phone Number', 'honor-labs-patient-portal' ); ?> <span class="required">*</span></label>
				<input type="tel" class="input-text" name="hlpp_phone" id="hlpp_phone" value="<?php echo isset( $_POST['hlpp_phone'] ) ? esc_attr( sanitize_text_field( wp_unslash( $_POST['hlpp_phone'] ) ) ) : ''; ?>" />
			</p>

			<p class="form-row form-row-wide">
				<label for="hlpp_referral_code"><?php esc_html_e( 'Doctor Referral Code', 'honor-labs-patient-portal' ); ?> <span class="required">*</span></label>
				<div class="hlpp-code-input-wrapper">
					<input type="text" class="input-text" name="hlpp_referral_code" id="hlpp_referral_code" value="<?php echo isset( $_POST['hlpp_referral_code'] ) ? esc_attr( sanitize_text_field( wp_unslash( $_POST['hlpp_referral_code'] ) ) ) : ''; ?>" />
					<button type="button" class="hlpp-verify-btn" id="hlpp_verify_code_btn"><?php esc_html_e( 'Verify Code', 'honor-labs-patient-portal' ); ?></button>
				</div>
				<div id="hlpp_code_validation_result" class="hlpp-validation-result"></div>
				<input type="hidden" name="hlpp_code_verified" id="hlpp_code_verified" value="0" />
				<input type="hidden" name="hlpp_linked_doctor_id" id="hlpp_linked_doctor_id" value="0" />
			</p>

			<?php do_action( 'hlpp_after_patient_fields' ); ?>
		</div>

		<?php
		$this->output_inline_styles();
		$this->output_inline_scripts();
	}

	/**
	 * Output inline CSS
	 */
	private function output_inline_styles() {
		?>
		<style type="text/css">
			/* Registration tabs */
			#hlpp-registration-tabs {
				margin-bottom: 20px;
			}

			.hlpp-tabs-list {
				list-style: none;
				padding: 0;
				margin: 0;
				display: flex;
				gap: 10px;
				border-bottom: 2px solid #e0e0e0;
			}

			.hlpp-tabs-list a {
				display: block;
				padding: 12px 20px;
				text-decoration: none;
				color: #666;
				cursor: pointer;
				border: none;
				background: none;
				font-size: 14px;
				font-weight: 500;
				transition: all 0.3s ease;
				border-bottom: 3px solid transparent;
				margin-bottom: -2px;
			}

			.hlpp-tabs-list a:hover {
				color: #1a3a5c;
			}

			.hlpp-tabs-list a.hlpp-active {
				color: #1a3a5c;
				border-bottom-color: #1a3a5c;
			}

			/* Patient form styling */
			#hlpp-patient-form-wrapper {
				padding: 20px;
				background-color: #f9f9f9;
				border: 1px solid #ddd;
				border-radius: 4px;
			}

			#hlpp-patient-form-wrapper.hlpp-hidden {
				display: none;
			}

			.hlpp-code-input-wrapper {
				display: flex;
				gap: 10px;
				align-items: flex-start;
			}

			.hlpp-code-input-wrapper input[type="text"] {
				flex: 1;
			}

			.hlpp-verify-btn {
				padding: 8px 16px;
				background-color: #1a3a5c;
				color: white;
				border: none;
				border-radius: 4px;
				cursor: pointer;
				font-size: 13px;
				font-weight: 500;
				transition: background-color 0.3s ease;
				height: 40px;
				white-space: nowrap;
			}

			.hlpp-verify-btn:hover {
				background-color: #0f2438;
			}

			.hlpp-verify-btn:disabled {
				opacity: 0.6;
				cursor: not-allowed;
			}

			.hlpp-verify-btn.hlpp-loading {
				pointer-events: none;
			}

			.hlpp-verify-btn.hlpp-loading::after {
				content: '';
				display: inline-block;
				width: 12px;
				height: 12px;
				margin-left: 6px;
				border: 2px solid rgba(255, 255, 255, 0.3);
				border-radius: 50%;
				border-top-color: white;
				animation: hlpp-spin 0.6s linear infinite;
			}

			@keyframes hlpp-spin {
				to { transform: rotate(360deg); }
			}

			.hlpp-validation-result {
				margin-top: 10px;
				padding: 12px;
				border-radius: 4px;
				font-size: 13px;
				display: none;
			}

			.hlpp-validation-result.hlpp-show {
				display: block;
			}

			.hlpp-validation-result.hlpp-success {
				background-color: #d4edda;
				border: 1px solid #c3e6cb;
				color: #155724;
			}

			.hlpp-validation-result.hlpp-error {
				background-color: #f8d7da;
				border: 1px solid #f5c6cb;
				color: #721c24;
			}

			.hlpp-doctor-info {
				margin-top: 8px;
				padding: 10px;
				background-color: rgba(26, 58, 92, 0.05);
				border-left: 3px solid #1a3a5c;
				border-radius: 2px;
			}

			.hlpp-doctor-info strong {
				color: #1a3a5c;
			}

			/* Hide doctor fields when patient is selected */
			.hl-registration-fields.hlpp-hidden {
				display: none;
			}

			/* Responsive */
			@media (max-width: 768px) {
				.hlpp-code-input-wrapper {
					flex-direction: column;
				}

				.hlpp-verify-btn {
					width: 100%;
				}

				.hlpp-tabs-list {
					flex-direction: column;
				}

				.hlpp-tabs-list a {
					width: 100%;
				}
			}
		</style>
		<?php
	}

	/**
	 * Output inline JavaScript
	 */
	private function output_inline_scripts() {
		?>
		<script type="text/javascript">
		var hlppData = {
			ajaxurl: '<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>',
			nonce:   '<?php echo wp_create_nonce( 'hlpp_validate_referral_code_nonce' ); ?>'
		};
		(function($) {
			$(document).ready(function() {
				var doctorTab = $('[data-tab="doctor"]');
				var patientTab = $('[data-tab="patient"]');
				var doctorFields = $('.hl-registration-fields');
				var patientFields = $('#hlpp-patient-form-wrapper');
				var registrationType = $('#hl_registration_type');

				// Show doctor tab if it doesn't have display: none in inline styles
				if (doctorTab.length) {
					doctorTab.show();
				}

				// Initialize: show patient form by default, hide doctor form
				patientFields.removeClass('hlpp-hidden');
				doctorFields.addClass('hlpp-hidden');
				patientTab.addClass('hlpp-active');

				// Toggle required: disable doctor fields when patient tab is default
				doctorFields.find('[required]').attr('data-required', 'true').removeAttr('required');

					// Sync B2BKing roles dropdown with tab selection and hide it
					var rolesDropdown = $('[name="b2bking_registration_roles_dropdown"]');
					rolesDropdown.closest('.form-row, p, .b2bking_custom_registration_container').hide();
					$('label[for="b2bking_registration_roles_dropdown"]').closest('.form-row, p').hide();
					rolesDropdown.val('role_696'); // Default: Patient

				// Tab switching
				$('.hlpp-tab-trigger').on('click', function(e) {
					e.preventDefault();
					var tab = $(this).data('tab');

					$('.hlpp-tab-trigger').removeClass('hlpp-active');
					$(this).addClass('hlpp-active');

					if (tab === 'doctor') {
						doctorFields.removeClass('hlpp-hidden');
						patientFields.addClass('hlpp-hidden');
						registrationType.val('doctor');
						// Re-enable required on doctor fields, disable on patient fields
						rolesDropdown.val('role_598'); // Doctor role
						doctorFields.find('[data-required]').attr('required', 'required');
						patientFields.find('[data-required]').removeAttr('required');
					} else {
						patientFields.removeClass('hlpp-hidden');
						doctorFields.addClass('hlpp-hidden');
						registrationType.val('patient');
						rolesDropdown.val('role_696'); // Patient role
						// Re-enable required on patient fields, disable on doctor fields
						patientFields.find('[data-required]').attr('required', 'required');
						doctorFields.find('[data-required]').removeAttr('required');
					}
				});

				// Referral code verification
				$('#hlpp_verify_code_btn').on('click', function(e) {
					e.preventDefault();
					var btn = $(this);
					var code = $('#hlpp_referral_code').val().trim();
					var resultDiv = $('#hlpp_code_validation_result');

					if (!code) {
						resultDiv.removeClass('hlpp-success').addClass('hlpp-error hlpp-show');
						resultDiv.text('<?php echo esc_js( __( 'Please enter a referral code.', 'honor-labs-patient-portal' ) ); ?>');
						return;
					}

					btn.addClass('hlpp-loading').prop('disabled', true);
					resultDiv.removeClass('hlpp-success hlpp-error hlpp-show').text('');

					$.ajax({
						url: hlppData.ajaxurl,
						type: 'POST',
						dataType: 'json',
						data: {
							action: 'hlpp_validate_referral_code',
							nonce: hlppData.nonce,
							referral_code: code
						},
						success: function(response) {
							if (response.success) {
								resultDiv.removeClass('hlpp-error').addClass('hlpp-success hlpp-show');
								resultDiv.html(response.data.message);
								$('#hlpp_code_verified').val('1');
								$('#hlpp_linked_doctor_id').val(response.data.doctor_id);
							} else {
								resultDiv.removeClass('hlpp-success').addClass('hlpp-error hlpp-show');
								resultDiv.text(response.data.message || '<?php echo esc_js( __( 'Invalid referral code.', 'honor-labs-patient-portal' ) ); ?>');
								$('#hlpp_code_verified').val('0');
								$('#hlpp_linked_doctor_id').val('0');
							}
						},
						error: function() {
							resultDiv.removeClass('hlpp-success').addClass('hlpp-error hlpp-show');
							resultDiv.text('<?php echo esc_js( __( 'An error occurred. Please try again.', 'honor-labs-patient-portal' ) ); ?>');
							$('#hlpp_code_verified').val('0');
							$('#hlpp_linked_doctor_id').val('0');
						},
						complete: function() {
							btn.removeClass('hlpp-loading').prop('disabled', false);
						}
					});
				});

				// Allow Enter key to verify code
				$('#hlpp_referral_code').on('keypress', function(e) {
					if (e.which === 13) {
						e.preventDefault();
						$('#hlpp_verify_code_btn').click();
					}
				});
			});
		})(jQuery);
		</script>
		<?php
	}

	/**
	 * Validate patient registration
	 */
	public function validate_patient_registration( $validation_errors, $username, $email, $password ) {
		// Only validate if this is a patient registration
		if ( ! isset( $_POST['hl_registration_type'] ) || $_POST['hl_registration_type'] !== 'patient' ) { // phpcs:ignore WordPress.Security.NonceVerification
			return $validation_errors;
		}

		// Validate first name
		if ( ! isset( $_POST['hlpp_first_name'] ) || empty( sanitize_text_field( wp_unslash( $_POST['hlpp_first_name'] ) ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			$validation_errors->add( 'hlpp_first_name_error', __( 'Please enter your first name.', 'honor-labs-patient-portal' ) );
		}

		// Validate last name
		if ( ! isset( $_POST['hlpp_last_name'] ) || empty( sanitize_text_field( wp_unslash( $_POST['hlpp_last_name'] ) ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			$validation_errors->add( 'hlpp_last_name_error', __( 'Please enter your last name.', 'honor-labs-patient-portal' ) );
		}

		// Validate phone
		if ( ! isset( $_POST['hlpp_phone'] ) || empty( sanitize_text_field( wp_unslash( $_POST['hlpp_phone'] ) ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			$validation_errors->add( 'hlpp_phone_error', __( 'Please enter your phone number.', 'honor-labs-patient-portal' ) );
		}

		// Validate referral code
		if ( ! isset( $_POST['hlpp_referral_code'] ) || empty( sanitize_text_field( wp_unslash( $_POST['hlpp_referral_code'] ) ) ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			$validation_errors->add( 'hlpp_referral_code_error', __( 'Please enter a referral code.', 'honor-labs-patient-portal' ) );
		}

		// Verify that code was actually validated
		if ( ! isset( $_POST['hlpp_code_verified'] ) || $_POST['hlpp_code_verified'] !== '1' ) { // phpcs:ignore WordPress.Security.NonceVerification
			$validation_errors->add( 'hlpp_code_not_verified_error', __( 'Please verify your referral code.', 'honor-labs-patient-portal' ) );
		}

		return $validation_errors;
	}

	/**
	 * Save patient data after successful registration
	 */
	public function save_patient_data( $customer_id ) {
		// Only process if this is a patient registration
		if ( ! isset( $_POST['hl_registration_type'] ) || $_POST['hl_registration_type'] !== 'patient' ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}

		// Get patient data
		$first_name    = isset( $_POST['hlpp_first_name'] ) ? sanitize_text_field( wp_unslash( $_POST['hlpp_first_name'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$last_name     = isset( $_POST['hlpp_last_name'] ) ? sanitize_text_field( wp_unslash( $_POST['hlpp_last_name'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$phone         = isset( $_POST['hlpp_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['hlpp_phone'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$referral_code = isset( $_POST['hlpp_referral_code'] ) ? sanitize_text_field( wp_unslash( $_POST['hlpp_referral_code'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$doctor_id     = isset( $_POST['hlpp_linked_doctor_id'] ) ? intval( wp_unslash( $_POST['hlpp_linked_doctor_id'] ) ) : 0; // phpcs:ignore WordPress.Security.NonceVerification

		// Save user meta
		update_user_meta( $customer_id, 'first_name', $first_name );
		update_user_meta( $customer_id, 'last_name', $last_name );
		update_user_meta( $customer_id, 'hl_patient_phone', $phone );
		update_user_meta( $customer_id, 'hl_linked_doctor_id', $doctor_id );
		update_user_meta( $customer_id, 'hl_patient_verified', 'yes' );
		update_user_meta( $customer_id, 'hl_patient_registration_date', current_time( 'mysql' ) );
		update_user_meta( $customer_id, 'hl_joined_via_code', $referral_code );

		// Assign to Patients B2BKing group
		if ( function_exists( 'b2bking' ) ) {
			$patients_group = hlpp_get_or_create_patients_group();
			if ( $patients_group ) {
				update_user_meta( $customer_id, 'b2bking_account_approval', 'approved' );
				update_user_meta( $customer_id, 'b2bking_b2buser', 'yes' );
				update_user_meta( $customer_id, 'b2bking_customergroup', $patients_group );
			}
		}

		// Send welcome email
		hlpp_send_patient_welcome_email( $customer_id );

		/**
		 * Action hook after patient data is saved
		 */
		do_action( 'hlpp_patient_registered', $customer_id, $doctor_id );
	}

	/**
	 * AJAX validation for referral code
	 */
	public function ajax_validate_referral_code() {
		// Verify nonce
		if ( ! isset( $_POST['nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['nonce'] ) ), 'hlpp_validate_referral_code_nonce' ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			wp_send_json_error( array( 'message' => __( 'Security check failed.', 'honor-labs-patient-portal' ) ) );
		}

		// Get referral code
		$referral_code = isset( $_POST['referral_code'] ) ? sanitize_text_field( wp_unslash( $_POST['referral_code'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification

		if ( empty( $referral_code ) ) {
			wp_send_json_error( array( 'message' => __( 'Please enter a referral code.', 'honor-labs-patient-portal' ) ) );
		}

		// Query for doctor with this referral code
		$doctors = new WP_User_Query( array(
			'meta_key'     => 'hl_referral_code',
			'meta_value'   => $referral_code,
			'meta_compare' => '=',
		) );

		if ( empty( $doctors->results ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid referral code.', 'honor-labs-patient-portal' ) ) );
		}

		$doctor = $doctors->results[0];
		$doctor_id = $doctor->ID;

		// Check if doctor is approved
		$approval_status = get_user_meta( $doctor_id, 'b2bking_account_approval', true );
		if ( $approval_status !== 'approved' ) {
			wp_send_json_error( array( 'message' => __( 'This doctor account is not approved.', 'honor-labs-patient-portal' ) ) );
		}

		// Check if doctor has application date
		$application_date = get_user_meta( $doctor_id, 'hl_application_date', true );
		if ( empty( $application_date ) ) {
			wp_send_json_error( array( 'message' => __( 'Invalid doctor account.', 'honor-labs-patient-portal' ) ) );
		}

		// Get doctor's practice name
		$practice_name = get_user_meta( $doctor_id, 'hl_practice_name', true );
		$doctor_first_name = $doctor->first_name;

		// Build success message
		$message = sprintf(
			'<strong>%s</strong> %s',
			esc_html__( 'Code verified!', 'honor-labs-patient-portal' ),
			__( 'Your doctor has been linked to your account.', 'honor-labs-patient-portal' )
		);

		$message .= '<div class="hlpp-doctor-info">';
		$message .= '<strong>' . esc_html( $doctor_first_name ) . '</strong>';
		if ( ! empty( $practice_name ) ) {
			$message .= '<br>' . esc_html( $practice_name );
		}
		$message .= '</div>';

		wp_send_json_success( array(
			'message'  => $message,
			'doctor_id' => $doctor_id,
		) );
	}

	/**
	 * Run daily churn check
	 */
	public function run_daily_churn_check() {
		$threshold_days = intval( get_option( 'honor_labs_churn_threshold_days', 90 ) );
		$grace_period_days = intval( get_option( 'honor_labs_grace_period_days', 14 ) );

		// Get all approved doctors
		$doctors = new WP_User_Query( array(
			'meta_key'     => 'b2bking_account_approval',
			'meta_value'   => 'approved',
			'meta_compare' => '=',
		) );

		if ( empty( $doctors->results ) ) {
			return;
		}

		foreach ( $doctors->results as $doctor ) {
			$doctor_id = $doctor->ID;

			// Check if already flagged as churned
			$already_churned = get_user_meta( $doctor_id, 'hl_doctor_churned', true );
			if ( $already_churned === 'yes' ) {
				continue;
			}

			// Get most recent order date
			$args = array(
				'customer' => $doctor_id,
				'return'   => 'ids',
				'limit'    => 1,
				'orderby'  => 'date',
				'order'    => 'DESC',
			);

			$orders = wc_get_orders( $args );

			if ( empty( $orders ) ) {
				// No orders, flag as churned
				update_user_meta( $doctor_id, 'hl_doctor_churned', 'yes' );
				$this->notify_patients_of_churn( $doctor_id, $grace_period_days );
			} else {
				// Check last order date
				$last_order = wc_get_order( $orders[0] );
				$last_order_date = $last_order->get_date_created();

				if ( $last_order_date ) {
					$days_since_order = floor( ( time() - $last_order_date->getTimestamp() ) / DAY_IN_SECONDS );

					if ( $days_since_order >= $threshold_days ) {
						// Flag as churned
						update_user_meta( $doctor_id, 'hl_doctor_churned', 'yes' );
						$this->notify_patients_of_churn( $doctor_id, $grace_period_days );
					}
				}
			}
		}
	}

	/**
	 * Notify patients of doctor churn
	 */
	private function notify_patients_of_churn( $doctor_id, $grace_period_days ) {
		$grace_end_date = date( 'Y-m-d', strtotime( "+{$grace_period_days} days" ) );

		// Find all patients linked to this doctor
		$patients = new WP_User_Query( array(
			'meta_key'     => 'hl_linked_doctor_id',
			'meta_value'   => $doctor_id,
			'meta_compare' => '=',
		) );

		if ( empty( $patients->results ) ) {
			return;
		}

		foreach ( $patients->results as $patient ) {
			update_user_meta( $patient->ID, 'hl_grace_period_end', $grace_end_date );
			hlpp_send_grace_period_email( $patient->ID, $grace_end_date );
		}
	}

	/**
	 * Run grace period check
	 */
	public function run_grace_period_check() {
		// Get all patients with grace period set
		$patients = new WP_User_Query( array(
			'meta_key'     => 'hl_grace_period_end',
			'meta_compare' => 'EXISTS',
		) );

		if ( empty( $patients->results ) ) {
			return;
		}

		$today = date( 'Y-m-d' );

		foreach ( $patients->results as $patient ) {
			$grace_end = get_user_meta( $patient->ID, 'hl_grace_period_end', true );

			if ( $grace_end && $grace_end <= $today ) {
				// Revoke access
				update_user_meta( $patient->ID, 'hl_patient_verified', 'no' );
				delete_user_meta( $patient->ID, 'hl_grace_period_end' );

				// Send revoked email
				hlpp_send_access_revoked_email( $patient->ID );
			}
		}
	}
}

// Initialize the plugin
new Honor_Labs_Patient_Portal();

/**
 * Get or create Patients B2BKing group
 */
function hlpp_get_or_create_patients_group() {
	// Search for existing Patients group
	$args = array(
		'post_type'   => 'b2bking_group',
		's'           => 'Patients',
		'numberposts' => -1,
	);

	$groups = get_posts( $args );

	foreach ( $groups as $group ) {
		if ( stripos( $group->post_title, 'Patients' ) !== false ) {
			return $group->ID;
		}
	}

	// Create new group
	$group_id = wp_insert_post( array(
		'post_type'   => 'b2bking_group',
		'post_title'  => 'Patients',
		'post_status' => 'publish',
	) );

	if ( ! is_wp_error( $group_id ) ) {
		return $group_id;
	}

	return false;
}

/**
 * Send patient welcome email
 */
function hlpp_send_patient_welcome_email( $patient_id ) {
	$patient = get_user_by( 'ID', $patient_id );

	if ( ! $patient ) {
		return false;
	}

	$doctor_id = intval( get_user_meta( $patient_id, 'hl_linked_doctor_id', true ) );
	$doctor = get_user_by( 'ID', $doctor_id );

	$to = $patient->user_email;
	$subject = sprintf(
		__( 'Welcome to Honor Labs, %s!', 'honor-labs-patient-portal' ),
		esc_html( $patient->first_name )
	);

	$doctor_name = $doctor ? esc_html( $doctor->first_name . ' ' . $doctor->last_name ) : __( 'Your doctor', 'honor-labs-patient-portal' );

	$message = hlpp_get_email_template(
		'welcome',
		array(
			'patient_first_name' => esc_html( $patient->first_name ),
			'doctor_name'        => $doctor_name,
		)
	);

	$headers = array( 'Content-Type: text/html; charset=UTF-8' );

	/**
	 * Filter patient welcome email
	 */
	$message = apply_filters( 'hlpp_patient_welcome_email', $message, $patient_id );
	$subject = apply_filters( 'hlpp_patient_welcome_email_subject', $subject, $patient_id );
	$to = apply_filters( 'hlpp_patient_welcome_email_to', $to, $patient_id );

	return wp_mail( $to, $subject, $message, $headers );
}

/**
 * Send grace period email
 */
function hlpp_send_grace_period_email( $patient_id, $end_date ) {
	$patient = get_user_by( 'ID', $patient_id );

	if ( ! $patient ) {
		return false;
	}

	$grace_days = intval( get_option( 'honor_labs_grace_period_days', 14 ) );
	$formatted_date = date_i18n( get_option( 'date_format' ), strtotime( $end_date ) );

	$to = $patient->user_email;
	$subject = __( 'Important: Your Doctor Account Status', 'honor-labs-patient-portal' );

	$message = hlpp_get_email_template(
		'grace_period',
		array(
			'patient_first_name' => esc_html( $patient->first_name ),
			'grace_period_days'  => $grace_days,
			'grace_end_date'     => $formatted_date,
		)
	);

	$headers = array( 'Content-Type: text/html; charset=UTF-8' );

	/**
	 * Filter grace period email
	 */
	$message = apply_filters( 'hlpp_grace_period_email', $message, $patient_id, $end_date );
	$subject = apply_filters( 'hlpp_grace_period_email_subject', $subject, $patient_id );
	$to = apply_filters( 'hlpp_grace_period_email_to', $to, $patient_id );

	return wp_mail( $to, $subject, $message, $headers );
}

/**
 * Send access revoked email
 */
function hlpp_send_access_revoked_email( $patient_id ) {
	$patient = get_user_by( 'ID', $patient_id );

	if ( ! $patient ) {
		return false;
	}

	$to = $patient->user_email;
	$subject = __( 'Your Honor Labs Access Has Been Revoked', 'honor-labs-patient-portal' );

	$message = hlpp_get_email_template(
		'access_revoked',
		array(
			'patient_first_name' => esc_html( $patient->first_name ),
		)
	);

	$headers = array( 'Content-Type: text/html; charset=UTF-8' );

	/**
	 * Filter access revoked email
	 */
	$message = apply_filters( 'hlpp_access_revoked_email', $message, $patient_id );
	$subject = apply_filters( 'hlpp_access_revoked_email_subject', $subject, $patient_id );
	$to = apply_filters( 'hlpp_access_revoked_email_to', $to, $patient_id );

	return wp_mail( $to, $subject, $message, $headers );
}

/**
 * Get email template
 */
function hlpp_get_email_template( $template, $variables = array() ) {
	$brand_color = '#1a3a5c';

	switch ( $template ) {
		case 'welcome':
			return sprintf(
				'<!DOCTYPE html>
				<html>
				<head>
					<meta charset="UTF-8">
					<style type="text/css">
						body { font-family: Arial, sans-serif; color: #333; }
						.email-header { background-color: %s; color: white; padding: 30px; text-align: center; }
						.email-header h1 { margin: 0; font-size: 24px; }
						.email-content { padding: 30px; background-color: #f9f9f9; }
						.email-content p { line-height: 1.6; margin: 15px 0; }
						.email-footer { padding: 20px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #ddd; }
						.button { display: inline-block; padding: 12px 24px; background-color: %s; color: white; text-decoration: none; border-radius: 4px; margin: 15px 0; }
					</style>
				</head>
				<body>
					<div class="email-header">
						<h1>Welcome to Honor Labs</h1>
					</div>
					<div class="email-content">
						<p>Hi %s,</p>
						<p>Thank you for registering with Honor Labs! Your account has been created and verified through your referral with %s.</p>
						<p>You now have access to our exclusive nutraceutical products and services. Visit your account to start exploring our catalog.</p>
						<a href="%s" class="button">View Your Account</a>
						<p>If you have any questions, please contact our support team.</p>
						<p>Best regards,<br>The Honor Labs Team</p>
					</div>
					<div class="email-footer">
						<p>&copy; 2024 Honor Labs. All rights reserved.</p>
					</div>
				</body>
				</html>',
				$brand_color,
				$brand_color,
				$variables['patient_first_name'] ?? '',
				$variables['doctor_name'] ?? '',
				esc_url( wc_get_account_endpoint_url( 'dashboard' ) )
			);

		case 'grace_period':
			return sprintf(
				'<!DOCTYPE html>
				<html>
				<head>
					<meta charset="UTF-8">
					<style type="text/css">
						body { font-family: Arial, sans-serif; color: #333; }
						.email-header { background-color: %s; color: white; padding: 30px; text-align: center; }
						.email-header h1 { margin: 0; font-size: 24px; }
						.email-content { padding: 30px; background-color: #f9f9f9; }
						.email-content p { line-height: 1.6; margin: 15px 0; }
						.warning-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
						.email-footer { padding: 20px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #ddd; }
					</style>
				</head>
				<body>
					<div class="email-header">
						<h1>Important Notice</h1>
					</div>
					<div class="email-content">
						<p>Hi %s,</p>
						<div class="warning-box">
							<p><strong>Your referral doctor account has been inactive.</strong></p>
							<p>You have %d days (until %s) to restore your doctor\'s account activity, or your access to Honor Labs will be revoked.</p>
						</div>
						<p>Please contact your doctor to reactivate their account. If you have questions, reach out to our support team.</p>
						<p>Best regards,<br>The Honor Labs Team</p>
					</div>
					<div class="email-footer">
						<p>&copy; 2024 Honor Labs. All rights reserved.</p>
					</div>
				</body>
				</html>',
				$brand_color,
				$variables['patient_first_name'] ?? '',
				$variables['grace_period_days'] ?? 14,
				$variables['grace_end_date'] ?? ''
			);

		case 'access_revoked':
			return sprintf(
				'<!DOCTYPE html>
				<html>
				<head>
					<meta charset="UTF-8">
					<style type="text/css">
						body { font-family: Arial, sans-serif; color: #333; }
						.email-header { background-color: %s; color: white; padding: 30px; text-align: center; }
						.email-header h1 { margin: 0; font-size: 24px; }
						.email-content { padding: 30px; background-color: #f9f9f9; }
						.email-content p { line-height: 1.6; margin: 15px 0; }
						.alert-box { background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; }
						.email-footer { padding: 20px; text-align: center; color: #777; font-size: 12px; border-top: 1px solid #ddd; }
					</style>
				</head>
				<body>
					<div class="email-header">
						<h1>Access Revoked</h1>
					</div>
					<div class="email-content">
						<p>Hi %s,</p>
						<div class="alert-box">
							<p><strong>Your Honor Labs access has been revoked.</strong></p>
							<p>Your referral doctor\'s account has remained inactive and the grace period has expired. As a result, your access to Honor Labs products and services has been revoked.</p>
						</div>
						<p>To regain access, please contact your doctor and ask them to reactivate their account. Once they do, you can request reinstatement of your account.</p>
						<p>If you have any questions, please contact our support team.</p>
						<p>Best regards,<br>The Honor Labs Team</p>
					</div>
					<div class="email-footer">
						<p>&copy; 2024 Honor Labs. All rights reserved.</p>
					</div>
				</body>
				</html>',
				$brand_color,
				$variables['patient_first_name'] ?? ''
			);

		default:
			return '';
	}
}

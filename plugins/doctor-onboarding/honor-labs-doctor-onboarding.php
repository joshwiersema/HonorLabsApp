<?php
/**
 * Plugin Name: Honor Labs Doctor Onboarding
 * Plugin URI: https://honorlabs.com
 * Description: Comprehensive doctor onboarding system with NPI verification, approval workflow, and admin management
 * Version: 1.0.1
 * Author: Honor Labs
 * Author URI: https://honorlabs.com
 * License: GPL-2.0-or-later
 * Text Domain: honor-labs-doctor-onboarding
 * Domain Path: /languages
 *
 * @package HonorLabsDoctorOnboarding
 */

// Exit if accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * =============================================================================
 * 1. ENHANCED REGISTRATION FORM
 * Hook into woocommerce_register_form to add doctor-specific fields
 * =============================================================================
 */
add_action( 'woocommerce_register_form', 'hl_add_registration_fields' );

function hl_add_registration_fields() {
	?>
	<div class="hl-registration-fields">
		<!-- First Name -->
		<p class="form-row form-row-first">
			<label for="hl_first_name"><?php esc_html_e( 'First Name', 'woocommerce' ); ?> <span class="required">*</span></label>
			<input type="text" class="input-text" name="hl_first_name" id="hl_first_name" value="<?php echo isset( $_POST['hl_first_name'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_first_name'] ) ) : ''; ?>" required />
		</p>

		<!-- Last Name -->
		<p class="form-row form-row-last">
			<label for="hl_last_name"><?php esc_html_e( 'Last Name', 'woocommerce' ); ?> <span class="required">*</span></label>
			<input type="text" class="input-text" name="hl_last_name" id="hl_last_name" value="<?php echo isset( $_POST['hl_last_name'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_last_name'] ) ) : ''; ?>" required />
		</p>

		<div class="clear"></div>

		<!-- Practice / Clinic Name -->
		<p class="form-row form-row-wide">
			<label for="hl_practice_name"><?php esc_html_e( 'Practice / Clinic Name', 'woocommerce' ); ?> <span class="required">*</span></label>
			<input type="text" class="input-text" name="hl_practice_name" id="hl_practice_name" value="<?php echo isset( $_POST['hl_practice_name'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_practice_name'] ) ) : ''; ?>" required />
		</p>

		<!-- Phone Number -->
		<p class="form-row form-row-wide">
			<label for="hl_phone"><?php esc_html_e( 'Phone Number', 'woocommerce' ); ?> <span class="required">*</span></label>
			<input type="tel" class="input-text" name="hl_phone" id="hl_phone" value="<?php echo isset( $_POST['hl_phone'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_phone'] ) ) : ''; ?>" required />
		</p>

		<!-- NPI Number with Verify Button -->
		<p class="form-row form-row-wide">
			<label for="hl_npi_number"><?php esc_html_e( 'NPI Number', 'woocommerce' ); ?> <span class="required">*</span></label>
			<div style="display: flex; gap: 10px; align-items: flex-start;">
				<input type="text" class="input-text" name="hl_npi_number" id="hl_npi_number" placeholder="10 digits" inputmode="numeric" maxlength="10" value="<?php echo isset( $_POST['hl_npi_number'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_npi_number'] ) ) : ''; ?>" required />
				<button type="button" id="hl_verify_npi_btn" class="button" style="white-space: nowrap; margin-top: 0;">Verify NPI</button>
			</div>
			<span id="hl_npi_status" style="display: none; margin-top: 5px; font-size: 12px;"></span>
		</p>

		<!-- Specialty -->
		<p class="form-row form-row-wide">
			<label for="hl_specialty"><?php esc_html_e( 'Specialty', 'woocommerce' ); ?> <span class="required">*</span></label>
			<select class="input-select" name="hl_specialty" id="hl_specialty" required>
				<option value=""><?php esc_html_e( 'Select Specialty', 'woocommerce' ); ?></option>
				<option value="Optometry (OD)" <?php selected( isset( $_POST['hl_specialty'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_specialty'] ) ) : '', 'Optometry (OD)', false ); ?>>Optometry (OD)</option>
				<option value="Ophthalmology (MD/DO)" <?php selected( isset( $_POST['hl_specialty'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_specialty'] ) ) : '', 'Ophthalmology (MD/DO)', false ); ?>>Ophthalmology (MD/DO)</option>
				<option value="General Practice" <?php selected( isset( $_POST['hl_specialty'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_specialty'] ) ) : '', 'General Practice', false ); ?>>General Practice</option>
				<option value="Internal Medicine" <?php selected( isset( $_POST['hl_specialty'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_specialty'] ) ) : '', 'Internal Medicine', false ); ?>>Internal Medicine</option>
				<option value="Other" <?php selected( isset( $_POST['hl_specialty'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_specialty'] ) ) : '', 'Other', false ); ?>>Other</option>
			</select>
		</p>

		<!-- State -->
		<p class="form-row form-row-wide">
			<label for="hl_practice_state"><?php esc_html_e( 'State', 'woocommerce' ); ?> <span class="required">*</span></label>
			<select class="input-select" name="hl_practice_state" id="hl_practice_state" required>
				<option value=""><?php esc_html_e( 'Select State', 'woocommerce' ); ?></option>
				<?php
				$states = hl_get_us_states();
				foreach ( $states as $code => $name ) {
					$selected = isset( $_POST['hl_practice_state'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_practice_state'] ) ) : '';
					echo '<option value="' . esc_attr( $code ) . '" ' . selected( $selected, $code, false ) . '>' . esc_html( $name ) . '</option>';
				}
				?>
			</select>
		</p>

		<!-- State License Number -->
		<p class="form-row form-row-wide">
			<label for="hl_license_number"><?php esc_html_e( 'State License Number', 'woocommerce' ); ?> <span class="required">*</span></label>
			<input type="text" class="input-text" name="hl_license_number" id="hl_license_number" value="<?php echo isset( $_POST['hl_license_number'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_license_number'] ) ) : ''; ?>" required />
		</p>

		<!-- Approximate Patients Per Week -->
		<p class="form-row form-row-wide">
			<label for="hl_patients_per_week"><?php esc_html_e( 'Approximate Patients Per Week', 'woocommerce' ); ?></label>
			<select class="input-select" name="hl_patients_per_week" id="hl_patients_per_week">
				<option value=""><?php esc_html_e( 'Select (Optional)', 'woocommerce' ); ?></option>
				<option value="1-25" <?php selected( isset( $_POST['hl_patients_per_week'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_patients_per_week'] ) ) : '', '1-25', false ); ?>>1-25</option>
				<option value="26-50" <?php selected( isset( $_POST['hl_patients_per_week'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_patients_per_week'] ) ) : '', '26-50', false ); ?>>26-50</option>
				<option value="51-100" <?php selected( isset( $_POST['hl_patients_per_week'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_patients_per_week'] ) ) : '', '51-100', false ); ?>>51-100</option>
				<option value="100+" <?php selected( isset( $_POST['hl_patients_per_week'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_patients_per_week'] ) ) : '', '100+', false ); ?>>100+</option>
			</select>
		</p>

		<!-- How Did You Hear About Honor Labs? -->
		<p class="form-row form-row-wide">
			<label for="hl_referral_source"><?php esc_html_e( 'How did you hear about Honor Labs?', 'woocommerce' ); ?></label>
			<select class="input-select" name="hl_referral_source" id="hl_referral_source">
				<option value=""><?php esc_html_e( 'Select (Optional)', 'woocommerce' ); ?></option>
				<option value="Colleague/Referral" <?php selected( isset( $_POST['hl_referral_source'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_referral_source'] ) ) : '', 'Colleague/Referral', false ); ?>>Colleague/Referral</option>
				<option value="Conference/Trade Show" <?php selected( isset( $_POST['hl_referral_source'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_referral_source'] ) ) : '', 'Conference/Trade Show', false ); ?>>Conference/Trade Show</option>
				<option value="Online Search" <?php selected( isset( $_POST['hl_referral_source'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_referral_source'] ) ) : '', 'Online Search', false ); ?>>Online Search</option>
				<option value="Social Media" <?php selected( isset( $_POST['hl_referral_source'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_referral_source'] ) ) : '', 'Social Media', false ); ?>>Social Media</option>
				<option value="Other" <?php selected( isset( $_POST['hl_referral_source'] ) ? sanitize_text_field( wp_unslash( $_POST['hl_referral_source'] ) ) : '', 'Other', false ); ?>>Other</option>
			</select>
		</p>

		<div class="clear"></div>
	</div>

	<style>
		.hl-registration-fields {
			margin: 20px 0;
			padding: 20px;
			background-color: #f9f9f9;
			border-radius: 4px;
		}
		.hl-registration-fields p {
			margin-bottom: 15px;
		}
		.hl-registration-fields label {
			display: block;
			margin-bottom: 5px;
			font-weight: 500;
		}
		.hl-registration-fields .required {
			color: #e2401c;
		}
		.hl-registration-fields input[type="text"],
		.hl-registration-fields input[type="tel"],
		.hl-registration-fields select {
			width: 100%;
			padding: 10px;
			border: 1px solid #ddd;
			border-radius: 4px;
			font-size: 14px;
		}
		#hl_npi_status.success { color: #28a745; }
		#hl_npi_status.error   { color: #dc3545; }
		#hl_npi_status.loading { color: #007bff; }
	</style>

	<script>
	(function() {
		const npiInput  = document.getElementById('hl_npi_number');
		const verifyBtn = document.getElementById('hl_verify_npi_btn');
		const statusDiv = document.getElementById('hl_npi_status');
		const ajaxUrl   = '<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>';
		const nonce     = '<?php echo wp_create_nonce( 'hl_verify_npi' ); ?>';

		verifyBtn.addEventListener('click', async function(e) {
			e.preventDefault();
			const npi = npiInput.value.trim();

			if (!npi) {
				statusDiv.textContent = 'Please enter an NPI number';
				statusDiv.className = 'error';
				statusDiv.style.display = 'block';
				return;
			}
			if (!/^\d{10}$/.test(npi)) {
				statusDiv.textContent = 'NPI must be exactly 10 digits';
				statusDiv.className = 'error';
				statusDiv.style.display = 'block';
				return;
			}

			statusDiv.textContent = 'Verifying...';
			statusDiv.className = 'loading';
			statusDiv.style.display = 'block';
			verifyBtn.disabled = true;

			try {
				const response = await fetch(ajaxUrl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: 'action=hl_verify_npi&npi=' + encodeURIComponent(npi) + '&nonce=' + encodeURIComponent(nonce)
				});
				const wrapper = await response.json();

				if (!wrapper.success) {
					statusDiv.textContent = wrapper.data ? wrapper.data.message : 'Verification failed.';
					statusDiv.className = 'error';
					statusDiv.style.display = 'block';
					verifyBtn.disabled = false;
					return;
				}

				const data = wrapper.data;
				if (data.result_count > 0) {
					const result = data.results[0];

					if (result.basic && result.basic.first_name)
						document.getElementById('hl_first_name').value = result.basic.first_name;
					if (result.basic && result.basic.last_name)
						document.getElementById('hl_last_name').value = result.basic.last_name;
					if (result.basic && result.basic.organization_name)
						document.getElementById('hl_practice_name').value = result.basic.organization_name;
					if (result.addresses && result.addresses.length > 0 && result.addresses[0].state)
						document.getElementById('hl_practice_state').value = result.addresses[0].state;

					if (result.taxonomies && result.taxonomies.length > 0) {
						const specialtyMap = {
							'Optometry':        'Optometry (OD)',
							'Ophthalmology':    'Ophthalmology (MD/DO)',
							'Internal Medicine':'Internal Medicine',
							'General Practice': 'General Practice'
						};
						for (let taxonomy of result.taxonomies) {
							if (taxonomy.primary) {
								const desc = taxonomy.desc || '';
								for (let key in specialtyMap) {
									if (desc.includes(key)) {
										document.getElementById('hl_specialty').value = specialtyMap[key];
										break;
									}
								}
								break;
							}
						}
					}

					statusDiv.textContent = 'NPI verified successfully!';
					statusDiv.className = 'success';
				} else {
					statusDiv.textContent = 'NPI not found in registry. Please verify and try again.';
					statusDiv.className = 'error';
				}
			} catch (error) {
				statusDiv.textContent = 'Error verifying NPI. Please try again.';
				statusDiv.className = 'error';
				console.error('NPI verification error:', error);
			} finally {
				verifyBtn.disabled = false;
			}
		});

		npiInput.addEventListener('keypress', function(e) {
			if (e.key === 'Enter') { e.preventDefault(); verifyBtn.click(); }
		});
	})();
	</script>
	<?php
}

/**
 * =============================================================================
 * 1b. SERVER-SIDE NPI VERIFICATION AJAX HANDLER
 * =============================================================================
 */
add_action( 'wp_ajax_nopriv_hl_verify_npi', 'hl_ajax_verify_npi' );
add_action( 'wp_ajax_hl_verify_npi',        'hl_ajax_verify_npi' );

function hl_ajax_verify_npi() {
	check_ajax_referer( 'hl_verify_npi', 'nonce' );

	$npi = isset( $_POST['npi'] ) ? sanitize_text_field( wp_unslash( $_POST['npi'] ) ) : '';

	if ( ! preg_match( '/^\d{10}$/', $npi ) ) {
		wp_send_json_error( array( 'message' => 'Invalid NPI format. Must be exactly 10 digits.' ) );
		return;
	}

	$api_url  = 'https://npiregistry.cms.hhs.gov/api/?number=' . rawurlencode( $npi ) . '&version=2.1';
	$response = wp_remote_get( $api_url, array( 'timeout' => 10 ) );

	if ( is_wp_error( $response ) ) {
		wp_send_json_error( array( 'message' => 'Could not connect to NPI Registry. Please try again.' ) );
		return;
	}

	$body = wp_remote_retrieve_body( $response );
	$data = json_decode( $body, true );

	if ( json_last_error() !== JSON_ERROR_NONE ) {
		wp_send_json_error( array( 'message' => 'Invalid response from NPI Registry.' ) );
		return;
	}

	wp_send_json_success( $data );
}

/**
 * =============================================================================
 * 2. SERVER-SIDE VALIDATION
 * =============================================================================
 */
add_filter( 'woocommerce_process_registration_errors', 'hl_validate_registration_fields', 10, 4 );

function hl_validate_registration_fields( $errors, $username, $email, $validation_error ) {
    // Skip doctor validation for patient registrations
    if ( isset( $_POST['hl_registration_type'] ) && $_POST['hl_registration_type'] === 'patient' ) {
        return $errors;
    }

	if ( empty( $_POST['hl_first_name'] ) )
		$errors->add( 'hl_first_name_error', esc_html__( 'First Name is required.', 'woocommerce' ) );
	if ( empty( $_POST['hl_last_name'] ) )
		$errors->add( 'hl_last_name_error', esc_html__( 'Last Name is required.', 'woocommerce' ) );
	if ( empty( $_POST['hl_practice_name'] ) )
		$errors->add( 'hl_practice_name_error', esc_html__( 'Practice / Clinic Name is required.', 'woocommerce' ) );
	if ( empty( $_POST['hl_phone'] ) )
		$errors->add( 'hl_phone_error', esc_html__( 'Phone Number is required.', 'woocommerce' ) );
	if ( empty( $_POST['hl_npi_number'] ) ) {
		$errors->add( 'hl_npi_number_error', esc_html__( 'NPI Number is required.', 'woocommerce' ) );
	} elseif ( ! preg_match( '/^\d{10}$/', sanitize_text_field( wp_unslash( $_POST['hl_npi_number'] ) ) ) ) {
		$errors->add( 'hl_npi_number_error', esc_html__( 'NPI Number must be exactly 10 digits.', 'woocommerce' ) );
	}
	if ( empty( $_POST['hl_specialty'] ) )
		$errors->add( 'hl_specialty_error', esc_html__( 'Specialty is required.', 'woocommerce' ) );
	if ( empty( $_POST['hl_practice_state'] ) )
		$errors->add( 'hl_practice_state_error', esc_html__( 'State is required.', 'woocommerce' ) );
	if ( empty( $_POST['hl_license_number'] ) )
		$errors->add( 'hl_license_number_error', esc_html__( 'State License Number is required.', 'woocommerce' ) );

	return $errors;
}

/**
 * =============================================================================
 * 3. SAVE FIELDS TO USER META
 * =============================================================================
 */
add_action( 'woocommerce_created_customer', 'hl_save_registration_fields', 10, 3 );

function hl_save_registration_fields( $customer_id, $new_customer_data = array(), $password_generated = false ) {
    // Skip saving doctor fields for patient registrations
    if ( isset( $_POST['hl_registration_type'] ) && $_POST['hl_registration_type'] === 'patient' ) {
        return;
    }

	$fields_to_save = array(
		'hl_first_name', 'hl_last_name', 'hl_practice_name', 'hl_phone',
		'hl_npi_number', 'hl_specialty', 'hl_practice_state', 'hl_license_number',
		'hl_patients_per_week', 'hl_referral_source',
	);

	foreach ( $fields_to_save as $field ) {
		if ( ! empty( $_POST[ $field ] ) ) {
			update_user_meta( $customer_id, $field, sanitize_text_field( wp_unslash( $_POST[ $field ] ) ) );
		}
	}

	update_user_meta( $customer_id, 'hl_application_date', current_time( 'mysql' ) );

	wp_update_user( array(
		'ID'         => $customer_id,
		'first_name' => sanitize_text_field( wp_unslash( $_POST['hl_first_name'] ) ),
		'last_name'  => sanitize_text_field( wp_unslash( $_POST['hl_last_name'] ) ),
	) );

	hl_send_admin_notification( $customer_id );
}

/**
 * =============================================================================
 * 4. ADMIN NOTIFICATION EMAIL
 * =============================================================================
 */
function hl_send_admin_notification( $customer_id ) {
	$user         = get_userdata( $customer_id );
	if ( ! $user ) return;

	$first_name   = get_user_meta( $customer_id, 'hl_first_name',    true );
	$last_name    = get_user_meta( $customer_id, 'hl_last_name',     true );
	$practice     = get_user_meta( $customer_id, 'hl_practice_name', true );
	$phone        = get_user_meta( $customer_id, 'hl_phone',         true );
	$npi          = get_user_meta( $customer_id, 'hl_npi_number',    true );
	$specialty    = get_user_meta( $customer_id, 'hl_specialty',     true );
	$state        = get_user_meta( $customer_id, 'hl_practice_state',true );
	$license      = get_user_meta( $customer_id, 'hl_license_number',true );

	$subject  = 'New Doctor Application - ' . $first_name . ' ' . $last_name;
	$message  = "New doctor registration received:\n\n";
	$message .= "Name: $first_name $last_name\n";
	$message .= "Email: " . $user->user_email . "\n";
	$message .= "Phone: $phone\n";
	$message .= "Practice: $practice\n";
	$message .= "NPI: $npi\n";
	$message .= "Specialty: $specialty\n";
	$message .= "State: $state\n";
	$message .= "License: $license\n";
	$message .= "\nManage applications: " . admin_url( 'admin.php?page=hl-doctor-applications' ) . "\n";

	wp_mail( get_option( 'admin_email' ), $subject, $message );
}

/**
 * =============================================================================
 * 5. APPROVAL / REJECTION EMAIL WATCHER
 * Fires when b2bking_account_approval meta is changed from any source.
 * =============================================================================
 */
add_action( 'updated_user_meta', 'hl_handle_approval_status_change', 10, 4 );

function hl_handle_approval_status_change( $meta_id, $user_id, $meta_key, $meta_value ) {
	if ( 'b2bking_account_approval' !== $meta_key ) return;

	if ( 'approved' === $meta_value ) {
		if ( ! get_user_meta( $user_id, 'hl_approval_email_sent', true ) ) {
			hl_send_approval_email( $user_id );
			update_user_meta( $user_id, 'hl_approval_email_sent', '1' );
		}
	} elseif ( 'rejected' === $meta_value ) {
		if ( ! get_user_meta( $user_id, 'hl_rejection_email_sent', true ) ) {
			hl_send_rejection_email( $user_id );
			update_user_meta( $user_id, 'hl_rejection_email_sent', '1' );
		}
	}
}

/**
 * =============================================================================
 * 6. APPROVAL EMAIL
 * =============================================================================
 */
function hl_send_approval_email( $customer_id ) {
	$user       = get_userdata( $customer_id );
	if ( ! $user ) return;

	$first_name    = get_user_meta( $customer_id, 'hl_first_name',    true );
	$practice      = get_user_meta( $customer_id, 'hl_practice_name', true );
	$referral_code = get_user_meta( $customer_id, 'hl_referral_code', true );
	$account_url   = wc_get_account_endpoint_url( 'dashboard' );
	$referral_link = add_query_arg( 'ref_code', $referral_code, wc_get_page_permalink( 'myaccount' ) );

	$subject = 'Your Honor Labs Account Has Been Approved';
	$body    = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>
		body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;line-height:1.6;color:#333}
		.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
		.hdr{background:#1a3a5c;color:#fff;padding:40px 20px;text-align:center}.hdr h1{margin:0;font-size:28px;font-weight:600}
		.body{padding:40px 30px}.body h2{color:#1a3a5c;font-size:22px;margin-top:0}
		.body p{margin:15px 0;color:#555}.hl{font-weight:600;color:#1a3a5c}
		.btn{display:inline-block;background:#1a3a5c;color:#fff;padding:15px 40px;text-decoration:none;border-radius:4px;font-weight:600;font-size:16px;margin:20px 0}
		.ftr{background:#f9f9f9;padding:20px 30px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee}
	</style></head><body><div class="wrap">
		<div class="hdr"><h1>Welcome to Honor Labs</h1></div>
		<div class="body">
			<h2>Congratulations, Dr. ' . esc_html( $first_name ) . '!</h2>
			<p>We\'re delighted to inform you that your application has been <span class="hl">approved</span>.</p>
			<p>Your account at <span class="hl">' . esc_html( $practice ) . '</span> is now active. You can log in and start placing wholesale orders.</p>
			<center><a href="' . esc_url( $account_url ) . '" class="btn">Access Your Account</a></center>
			' . ( $referral_code ? '
			<div style="margin:30px 0;padding:20px;background:#f0f4f8;border-radius:6px;border:1px solid #c3d4e5;">
				<p style="margin:0 0 8px 0;font-weight:600;color:#1a3a5c;">Your Patient Referral Code</p>
				<p style="margin:0 0 8px 0;font-size:24px;font-weight:700;letter-spacing:2px;color:#1a3a5c;">' . esc_html( $referral_code ) . '</p>
				<p style="margin:0;font-size:13px;color:#777;">Share this code with your patients so they can register on Honor Labs and purchase your branded supplements directly. You can also share this link:</p>
				<p style="margin:8px 0 0 0;font-size:13px;word-break:break-all;"><a href="' . esc_url( $referral_link ) . '" style="color:#2a6496;">' . esc_url( $referral_link ) . '</a></p>
			</div>' : '' ) . '
			<p style="margin-top:30px">Questions? Reach us at <span class="hl">support@honorlabs.com</span>.</p>
			<p style="color:#999;font-size:14px;margin-top:30px">Best regards,<br>The Honor Labs Team</p>
		</div>
		<div class="ftr"><p>Honor Labs &copy; ' . gmdate( 'Y' ) . '. All rights reserved.</p></div>
	</div></body></html>';

	wp_mail( $user->user_email, $subject, $body, array( 'Content-Type: text/html; charset=UTF-8' ) );
}

/**
 * =============================================================================
 * 7. REJECTION EMAIL
 * =============================================================================
 */
function hl_send_rejection_email( $customer_id ) {
	$user = get_userdata( $customer_id );
	if ( ! $user ) return;

	$first_name = get_user_meta( $customer_id, 'hl_first_name', true );
	$subject    = 'Honor Labs Application Status';
	$body       = '<!DOCTYPE html><html><head><meta charset="utf-8"><style>
		body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;line-height:1.6;color:#333}
		.wrap{max-width:600px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)}
		.hdr{background:#1a3a5c;color:#fff;padding:40px 20px;text-align:center}.hdr h1{margin:0;font-size:28px;font-weight:600}
		.body{padding:40px 30px}.body h2{color:#1a3a5c;font-size:22px;margin-top:0}
		.body p{margin:15px 0;color:#555}.hl{font-weight:600;color:#1a3a5c}
		.ftr{background:#f9f9f9;padding:20px 30px;text-align:center;font-size:12px;color:#999;border-top:1px solid #eee}
	</style></head><body><div class="wrap">
		<div class="hdr"><h1>Honor Labs</h1></div>
		<div class="body">
			<h2>Thank You for Your Interest</h2>
			<p>Dear Dr. ' . esc_html( $first_name ) . ',</p>
			<p>Thank you for applying to Honor Labs. We appreciate your interest.</p>
			<p>Unfortunately, we\'re unable to approve your application at this time based on our current program requirements.</p>
			<p>Questions? Contact us at <span class="hl">support@honorlabs.com</span>.</p>
			<p style="margin-top:30px;color:#999;font-size:14px">Best regards,<br>The Honor Labs Team</p>
		</div>
		<div class="ftr"><p>Honor Labs &copy; ' . gmdate( 'Y' ) . '. All rights reserved.</p></div>
	</div></body></html>';

	wp_mail( $user->user_email, $subject, $body, array( 'Content-Type: text/html; charset=UTF-8' ) );
}

/**
 * =============================================================================
 * 8. ADMIN MENU PAGE — DOCTOR APPLICATIONS
 * =============================================================================
 */
add_action( 'admin_menu', 'hl_add_admin_menu' );

function hl_add_admin_menu() {
	$pending = hl_count_pending_applications();
	$label   = esc_html__( 'Doctor Applications', 'honor-labs-doctor-onboarding' );
	if ( $pending > 0 ) {
		$label .= ' <span class="awaiting-mod"><span class="pending-count">' . intval( $pending ) . '</span></span>';
	}
	add_menu_page(
		esc_html__( 'Doctor Applications', 'honor-labs-doctor-onboarding' ),
		$label,
		'manage_options',
		'hl-doctor-applications',
		'hl_render_doctor_applications_page',
		'dashicons-groups',
		56
	);
}

function hl_count_pending_applications() {
	$users   = get_users( array( 'meta_query' => array( array( 'key' => 'hl_application_date', 'compare' => 'EXISTS' ) ) ) );
	$pending = 0;
	foreach ( $users as $user ) {
		$status = get_user_meta( $user->ID, 'b2bking_account_approval', true );
		if ( empty( $status ) || 'pending' === $status ) $pending++;
	}
	return $pending;
}

/**
 * Approve a doctor: set all required B2BKing meta, assign to B2B Users group,
 * fire B2BKing hooks, and bust caches so the change takes effect immediately.
 *
 * THIS WAS THE BUG: the old code only set b2bking_account_approval and
 * b2bking_b2buser but never set b2bking_customergroup, so B2BKing never
 * actually granted wholesale access.
 */
function hl_approve_doctor( $user_id ) {
	// Core B2BKing approval flags.
	update_user_meta( $user_id, 'b2bking_account_approval', 'approved' );
	update_user_meta( $user_id, 'b2bking_b2buser',          'yes' );

	// *** THE KEY FIX: assign the user to the B2B Users group (post ID 599). ***
	// Without this, B2BKing sees the user as approved but has no group, so it
	// cannot apply B2B pricing rules or grant ordering permissions.
	$group_id = hl_get_b2b_users_group_id();
	if ( $group_id ) {
		update_user_meta( $user_id, 'b2bking_customergroup', $group_id );
	}

	// Generate a unique referral code for patient registration.
	if ( empty( get_user_meta( $user_id, 'hl_referral_code', true ) ) ) {
		$code = hl_generate_referral_code();
		update_user_meta( $user_id, 'hl_referral_code', $code );
	}

	// Fire B2BKing's own approval action so any internal logic it has runs too.
	do_action( 'b2bking_user_account_approved', $user_id );

	// Fire Honor Labs approval action for other plugins to hook into.
	do_action( 'hl_doctor_approved', $user_id );

	// Bust B2BKing's per-user transient cache so the change is visible immediately.
	delete_transient( 'b2bking_user_group_' . $user_id );
	delete_transient( 'b2bking_'            . $user_id );

	// Bust the WP object cache for this user's meta.
	wp_cache_delete( $user_id, 'user_meta' );
}

/**
 * Generate a unique doctor referral code in format DR-XXX-YYY-ZZZ.
 */
function hl_generate_referral_code() {
	$chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion.
	for ( $attempt = 0; $attempt < 20; $attempt++ ) {
		$code = 'DR-';
		for ( $i = 0; $i < 3; $i++ ) {
			$seg = '';
			for ( $j = 0; $j < 3; $j++ ) {
				$seg .= $chars[ wp_rand( 0, strlen( $chars ) - 1 ) ];
			}
			$code .= $seg;
			if ( $i < 2 ) {
				$code .= '-';
			}
		}
		// Ensure uniqueness.
		$existing = get_users( array(
			'meta_key'   => 'hl_referral_code',
			'meta_value' => $code,
			'number'     => 1,
			'fields'     => 'ID',
		) );
		if ( empty( $existing ) ) {
			return $code;
		}
	}
	// Fallback — extremely unlikely.
	return 'DR-' . strtoupper( wp_generate_password( 9, false ) );
}

/**
 * Return the post ID of the B2BKing "B2B Users" customer group.
 * Falls back to the first published group if the name doesn't match exactly.
 */
function hl_get_b2b_users_group_id() {
	$groups = get_posts( array(
		'post_type'   => 'b2bking_group',
		'post_status' => 'publish',
		'numberposts' => -1,
		'orderby'     => 'title',
		'order'       => 'ASC',
	) );

	foreach ( $groups as $group ) {
		if ( false !== stripos( $group->post_title, 'B2B Users' ) ) {
			return $group->ID;
		}
	}

	// Fallback: first available group.
	return ! empty( $groups ) ? $groups[0]->ID : null;
}

function hl_render_doctor_applications_page() {
	// Handle approve / reject actions.
	if ( isset( $_GET['action'], $_GET['user_id'], $_GET['_wpnonce'] ) ) {
		$user_id = intval( $_GET['user_id'] );
		$action  = sanitize_text_field( wp_unslash( $_GET['action'] ) );
		$nonce   = sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) );

		if ( wp_verify_nonce( $nonce, 'hl_approve_reject_' . $user_id ) ) {
			if ( 'hl_approve' === $action ) {
				hl_approve_doctor( $user_id );
				wp_redirect( add_query_arg( 'notice', 'approved', admin_url( 'admin.php?page=hl-doctor-applications' ) ) );
				exit;
			} elseif ( 'hl_reject' === $action ) {
				update_user_meta( $user_id, 'b2bking_account_approval', 'rejected' );
				wp_redirect( add_query_arg( 'notice', 'rejected', admin_url( 'admin.php?page=hl-doctor-applications' ) ) );
				exit;
			}
		}
	}

	$current_tab = isset( $_GET['tab'] ) ? sanitize_text_field( wp_unslash( $_GET['tab'] ) ) : 'all';
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Doctor Applications', 'honor-labs-doctor-onboarding' ); ?></h1>

		<?php if ( isset( $_GET['notice'] ) ) :
			$notice = sanitize_text_field( wp_unslash( $_GET['notice'] ) ); ?>
			<div class="notice notice-success is-dismissible"><p>
				<?php echo 'approved' === $notice
					? esc_html__( 'Application approved. Doctor now has full wholesale access.', 'honor-labs-doctor-onboarding' )
					: esc_html__( 'Application rejected successfully.', 'honor-labs-doctor-onboarding' ); ?>
			</p></div>
		<?php endif; ?>

		<!-- Tabs -->
		<div class="nav-tab-wrapper">
			<?php
			$tabs = array( 'all' => 'All Applications', 'pending' => 'Pending', 'approved' => 'Approved', 'rejected' => 'Rejected' );
			foreach ( $tabs as $key => $label ) {
				$count = hl_get_applications_count_by_status( $key );
				$class = ( $key === $current_tab ) ? 'nav-tab nav-tab-active' : 'nav-tab';
				$url   = add_query_arg( 'tab', $key, admin_url( 'admin.php?page=hl-doctor-applications' ) );
				echo '<a href="' . esc_url( $url ) . '" class="' . esc_attr( $class ) . '">' . esc_html( $label ) . ' (' . intval( $count ) . ')</a>';
			}
			?>
		</div>

		<div style="background:white;padding:20px;border-radius:8px;margin-top:20px;">
			<?php hl_render_applications_table( $current_tab ); ?>
		</div>
	</div>

	<style>
		.hl-table{width:100%;border-collapse:collapse;margin-top:20px}
		.hl-table th{background:#f5f5f5;padding:12px;text-align:left;font-weight:600;border-bottom:2px solid #ddd}
		.hl-table td{padding:12px;border-bottom:1px solid #eee}
		.hl-table tr:hover{background:#f9f9f9}
		.status-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
		.status-pending{background:#fff3cd;color:#856404}
		.status-approved{background:#d4edda;color:#155724}
		.status-rejected{background:#f8d7da;color:#721c24}
		.action-button{padding:4px 10px;margin-right:5px;font-size:12px;text-decoration:none;border-radius:4px}
		.button-approve{background:#28a745;color:white;border:none;cursor:pointer}
		.button-approve:hover{background:#218838;color:white}
		.button-reject{background:#dc3545;color:white;border:none;cursor:pointer}
		.button-reject:hover{background:#c82333;color:white}
		.nav-tab-wrapper{border-bottom:1px solid #ccc;margin:20px 0}
		.nav-tab{background:#f5f5f5;border:1px solid #ccc;border-bottom:none;color:#0073aa;cursor:pointer;display:inline-block;padding:9px 10px;text-decoration:none;margin:0 2px 0 0}
		.nav-tab:hover{background:#f9f9f9}
		.nav-tab-active{background:white;border-bottom:1px solid white;font-weight:600}
		.user-name{font-weight:600;color:#1a3a5c}
		.user-contact{font-size:12px;color:#666;margin-top:4px}
	</style>
	<?php
}

function hl_get_applications_count_by_status( $tab = 'all' ) {
	$users = get_users( array( 'meta_query' => array( array( 'key' => 'hl_application_date', 'compare' => 'EXISTS' ) ) ) );
	$count = 0;
	foreach ( $users as $user ) {
		$status = get_user_meta( $user->ID, 'b2bking_account_approval', true );
		$status = empty( $status ) ? 'pending' : $status;
		if ( 'all' === $tab || $status === $tab ) $count++;
	}
	return $count;
}

function hl_render_applications_table( $tab = 'all' ) {
	$users = get_users( array(
		'meta_query' => array( array( 'key' => 'hl_application_date', 'compare' => 'EXISTS' ) ),
		'orderby'    => 'registered',
		'order'      => 'DESC',
	) );

	if ( empty( $users ) ) {
		echo '<p>' . esc_html__( 'No applications found.', 'honor-labs-doctor-onboarding' ) . '</p>';
		return;
	}

	echo '<table class="hl-table"><thead><tr>
		<th>Name</th><th>Email</th><th>Practice</th><th>NPI</th>
		<th>Specialty</th><th>State</th><th>Patients/Wk</th><th>Applied</th>
		<th>Status</th><th>Actions</th>
	</tr></thead><tbody>';

	foreach ( $users as $user ) {
		$status = get_user_meta( $user->ID, 'b2bking_account_approval', true );
		$status = empty( $status ) ? 'pending' : $status;
		if ( 'all' !== $tab && $status !== $tab ) continue;

		$first      = get_user_meta( $user->ID, 'hl_first_name',     true );
		$last       = get_user_meta( $user->ID, 'hl_last_name',      true );
		$phone      = get_user_meta( $user->ID, 'hl_phone',          true );
		$practice   = get_user_meta( $user->ID, 'hl_practice_name',  true );
		$npi        = get_user_meta( $user->ID, 'hl_npi_number',     true );
		$specialty  = get_user_meta( $user->ID, 'hl_specialty',      true );
		$state      = get_user_meta( $user->ID, 'hl_practice_state', true );
		$license    = get_user_meta( $user->ID, 'hl_license_number', true );
		$ppw        = get_user_meta( $user->ID, 'hl_patients_per_week', true );
		$app_date   = get_user_meta( $user->ID, 'hl_application_date', true );

		echo '<tr>';
		echo '<td><div class="user-name">' . esc_html( "$first $last" ) . '</div>'
		   . '<div class="user-contact">Phone: ' . esc_html( $phone ) . '<br>License: ' . esc_html( $license ) . '</div></td>';
		echo '<td>' . esc_html( $user->user_email ) . '</td>';
		echo '<td>' . esc_html( $practice ) . '</td>';
		echo '<td><a href="https://npiregistry.cms.hhs.gov/search?number=' . esc_attr( $npi ) . '" target="_blank" rel="noopener noreferrer">' . esc_html( $npi ) . '</a></td>';
		echo '<td>' . esc_html( $specialty ) . '</td>';
		echo '<td>' . esc_html( $state ) . '</td>';
		echo '<td>' . esc_html( $ppw ? $ppw : '—' ) . '</td>';
		echo '<td>' . esc_html( mysql2date( 'M d, Y', $app_date ) ) . '</td>';
		echo '<td><span class="status-badge status-' . esc_attr( $status ) . '">' . esc_html( ucfirst( $status ) ) . '</span></td>';
		echo '<td>';
		if ( 'pending' === $status ) {
			echo '<a href="' . esc_url( wp_nonce_url(
				add_query_arg( array( 'action' => 'hl_approve', 'user_id' => $user->ID ), admin_url( 'admin.php?page=hl-doctor-applications' ) ),
				'hl_approve_reject_' . $user->ID
			) ) . '" class="button button-approve action-button">Approve</a>';
			echo '<a href="' . esc_url( wp_nonce_url(
				add_query_arg( array( 'action' => 'hl_reject', 'user_id' => $user->ID ), admin_url( 'admin.php?page=hl-doctor-applications' ) ),
				'hl_approve_reject_' . $user->ID
			) ) . '" class="button button-reject action-button">Reject</a>';
		}
		echo '</td></tr>';
	}

	echo '</tbody></table>';
}

/**
 * =============================================================================
 * 9. ADMIN USERS LIST COLUMNS
 * =============================================================================
 */
add_filter( 'manage_users_columns',       'hl_add_user_columns' );
add_action( 'manage_users_custom_column', 'hl_render_user_column', 10, 3 );

function hl_add_user_columns( $columns ) {
	$columns['hl_practice'] = 'Practice';
	$columns['hl_npi']      = 'NPI';
	$columns['hl_specialty']= 'Specialty';
	return $columns;
}

function hl_render_user_column( $output, $column_name, $user_id ) {
	$map = array(
		'hl_practice' => 'hl_practice_name',
		'hl_npi'      => 'hl_npi_number',
		'hl_specialty'=> 'hl_specialty',
	);
	if ( isset( $map[ $column_name ] ) ) {
		$val = get_user_meta( $user_id, $map[ $column_name ], true );
		return $val ? esc_html( $val ) : '—';
	}
	return $output;
}

/**
 * =============================================================================
 * HELPER: US States list
 * =============================================================================
 */
function hl_get_us_states() {
	return array(
		'AL'=>'Alabama','AK'=>'Alaska','AZ'=>'Arizona','AR'=>'Arkansas','CA'=>'California',
		'CO'=>'Colorado','CT'=>'Connecticut','DE'=>'Delaware','FL'=>'Florida','GA'=>'Georgia',
		'HI'=>'Hawaii','ID'=>'Idaho','IL'=>'Illinois','IN'=>'Indiana','IA'=>'Iowa',
		'KS'=>'Kansas','KY'=>'Kentucky','LA'=>'Louisiana','ME'=>'Maine','MD'=>'Maryland',
		'MA'=>'Massachusetts','MI'=>'Michigan','MN'=>'Minnesota','MS'=>'Mississippi','MO'=>'Missouri',
		'MT'=>'Montana','NE'=>'Nebraska','NV'=>'Nevada','NH'=>'New Hampshire','NJ'=>'New Jersey',
		'NM'=>'New Mexico','NY'=>'New York','NC'=>'North Carolina','ND'=>'North Dakota','OH'=>'Ohio',
		'OK'=>'Oklahoma','OR'=>'Oregon','PA'=>'Pennsylvania','RI'=>'Rhode Island','SC'=>'South Carolina',
		'SD'=>'South Dakota','TN'=>'Tennessee','TX'=>'Texas','UT'=>'Utah','VT'=>'Vermont',
		'VA'=>'Virginia','WA'=>'Washington','WV'=>'West Virginia','WI'=>'Wisconsin','WY'=>'Wyoming',
	);
}

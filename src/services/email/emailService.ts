import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  publicKey: 'mwIuHzgqHXgrTTdBy',
  privateKey: 'ma7AP-97VNGJ-7mIDjIjM',
  serviceId: 'service_c5femws',
  templates: {
    passwordReset: 'template_r4v1wvq',
    eventNotification: 'template_3e7hv7y',
  },
};

// Initialize EmailJS with public key
emailjs.init(EMAILJS_CONFIG.publicKey);

/**
 * Email template parameters for password reset
 */
export interface PasswordResetEmailParams {
  user_name: string;
  temp_password: string;
  login_url: string;
}

/**
 * Email template parameters for event notification
 */
export interface EventNotificationEmailParams {
  user_name: string;
  event_title: string;
  event_date: string;
  event_time: string;
  event_location: string;
  event_description: string;
  event_url: string;
}

/**
 * Send password reset email to a user
 * @param toEmail - Recipient email address
 * @param params - Email template parameters
 * @returns Promise with success status and optional error message
 */
export const sendPasswordResetEmail = async (
  toEmail: string,
  params: PasswordResetEmailParams
): Promise<{ success: boolean; error?: string }> => {
  try {
    const templateParams = {
      to_email: toEmail,
      ...params,
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.passwordReset,
      templateParams
    );

    if (response.status === 200) {
      console.log('Password reset email sent successfully to:', toEmail);
      return { success: true };
    } else {
      console.error('Failed to send password reset email. Status:', response.status);
      return { success: false, error: 'Failed to send email' };
    }
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Send event notification email to a user
 * @param toEmail - Recipient email address
 * @param params - Email template parameters
 * @returns Promise with success status and optional error message
 */
export const sendEventNotificationEmail = async (
  toEmail: string,
  params: EventNotificationEmailParams
): Promise<{ success: boolean; error?: string }> => {
  try {
    const templateParams = {
      to_email: toEmail,
      ...params,
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templates.eventNotification,
      templateParams
    );

    if (response.status === 200) {
      console.log('Event notification email sent successfully to:', toEmail);
      return { success: true };
    } else {
      console.error('Failed to send event notification email. Status:', response.status);
      return { success: false, error: 'Failed to send email' };
    }
  } catch (error) {
    console.error('Error sending event notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

/**
 * Send event notifications to multiple users
 * @param recipients - Array of recipient objects with email and name
 * @param params - Email template parameters (without user_name as it varies per recipient)
 * @returns Promise with results array containing success/failure for each recipient
 */
export const sendBulkEventNotifications = async (
  recipients: Array<{ email: string; name: string }>,
  params: Omit<EventNotificationEmailParams, 'user_name'>
): Promise<Array<{ email: string; success: boolean; error?: string }>> => {
  const results = [];

  for (const recipient of recipients) {
    const result = await sendEventNotificationEmail(recipient.email, {
      user_name: recipient.name,
      ...params,
    });

    results.push({
      email: recipient.email,
      success: result.success,
      error: result.error,
    });

    // Add a small delay between emails to avoid rate limiting (200 emails/month limit)
    // Delay: 300ms between each email
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return results;
};

/**
 * Get the base URL for the application
 * Used for generating links in emails
 */
export const getAppBaseUrl = (): string => {
  // In production, this should come from environment variables
  // For now, use window.location.origin
  return typeof window !== 'undefined' ? window.location.origin : '';
};

/**
 * Generate login URL for password reset emails
 */
export const getLoginUrl = (): string => {
  return `${getAppBaseUrl()}/login`;
};

/**
 * Generate event URL for event notification emails
 * @param eventId - Event ID
 */
export const getEventUrl = (eventId: string): string => {
  return `${getAppBaseUrl()}/events#${eventId}`;
};


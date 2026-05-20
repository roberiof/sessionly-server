export const RESPONSE = {
  AUTH: {
    LOGIN_SUCCESS: 'Signed in successfully.',
    REFRESH_SUCCESS: 'Session refreshed successfully.',
    LOGOUT_SUCCESS: 'Logged out successfully.',
  },
  AVAILABILITY: {
    SLOT_CREATED_SUCCESSFULLY: 'Availability slot created successfully.',
    RULES_UPDATED_SUCCESSFULLY: 'Availability rules updated successfully.',
    SLOT_DELETED_SUCCESSFULLY: 'Availability slot deleted successfully.',
    FETCHED_SUCCESSFULLY: 'Availability fetched successfully.',
  },
  USERS: {
    CREATED_SUCCESSFULLY: 'User created successfully.',
    FETCHED_SUCCESSFULLY: 'User fetched successfully.',
    DELETED_SUCCESSFULLY: 'User deleted successfully.',
    UPDATED_SUCCESSFULLY: 'User updated successfully.',
    PASSWORD_UPDATED_SUCCESSFULLY: 'User password updated successfully.',
    RESTORED_SUCCESSFULLY: 'User restored successfully.',
    AVATAR_UPLOADED_SUCCESSFULLY: 'User avatar uploaded successfully.',
  },
} as const;

import React, { useState, useEffect } from "react";
import api from "../../services/api";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Divider,
  Avatar,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import AlertMessage from "../../components/common/AlertMessage";
import { useAuth } from "../../context/AuthContext";
import { updatePassword } from "../../services/authService";

// Validation schema for profile update
const profileValidationSchema = Yup.object({
  name: Yup.string()
    .required("Name is required")
    .max(100, "Name cannot be longer than 100 characters"),
  company_name: Yup.string()
    .required("Company name is required")
    .max(100, "Company name cannot be longer than 100 characters"),
  email: Yup.string()
    .email("Enter a valid email")
    .required("Email is required"),
});

// Validation schema for password change
const passwordValidationSchema = Yup.object({
  current_password: Yup.string().required("Current password is required"),
  new_password: Yup.string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
  confirm_password: Yup.string()
    .oneOf([Yup.ref("new_password"), null], "Passwords must match")
    .required("Confirm your new password"),
});

const Profile = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [notificationEmails, setNotificationEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Initialize formik for profile
  const profileFormik = useFormik({
    initialValues: {
      name: currentUser?.name || "",
      email: currentUser?.email || "",
    },
    validationSchema: profileValidationSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        // In a real implementation, this would call the API
        // await updateUserProfile(values);

        // Simulate a successful update
        setTimeout(() => {
          setAlert({
            open: true,
            message: "Profile updated successfully",
            severity: "success",
          });
          setLoading(false);
        }, 1000);
      } catch (error) {
        setAlert({
          open: true,
          message: error.message || "Error updating profile",
          severity: "error",
        });
        setLoading(false);
      }
    },
  });

  // Initialize formik for password
  const passwordFormik = useFormik({
    initialValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
    validationSchema: passwordValidationSchema,
    onSubmit: async (values, { resetForm }) => {
      setLoading(true);
      try {
        // Call the API to update the password
        await updatePassword(values.current_password, values.new_password);

        // Show success message
        setAlert({
          open: true,
          message: "Password updated successfully",
          severity: "success",
        });

        // Reset the form
        resetForm();

        // Reset password visibility
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
      } catch (error) {
        console.error("Error updating password:", error);
        setAlert({
          open: true,
          message:
            error.message ||
            "Error updating password. Please try again.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    },
  });

  // Load notification emails when component mounts (only for admin users)
  useEffect(() => {
    const loadNotificationEmails = async () => {
      // Only load emails for admin users
      if (currentUser?.role !== 'admin' || !currentUser?.company_id) return;

      try {
        const response = await api.get(
          `/v1/companies/${currentUser.company_id}/emails`,
        );
        setNotificationEmails(response.data || []);
      } catch (error) {
        console.error("Error loading notification emails:", error);
        setAlert({
          open: true,
          message: "Error loading notification emails",
          severity: "error",
        });
      }
    };

    loadNotificationEmails();
  }, [currentUser?.company_id, currentUser?.role]);

  // Handle closing alert messages
  const handleAlertClose = () => {
    setAlert({ ...alert, open: false });
  };

  // Handle adding a new notification email address
  const handleAddEmail = async (e) => {
    e.preventDefault();

    // Validate email
    if (!newEmail) {
      setEmailError("Email is required");
      return;
    }

    if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(newEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (notificationEmails.includes(newEmail)) {
      setEmailError("This email is already in the list");
      return;
    }

    try {
      const response = await api.post(
        `/v1/companies/${currentUser.company_id}/emails`,
        { email: newEmail },
      );

      setNotificationEmails(response.data);
      setNewEmail("");
      setEmailError("");

      setAlert({
        open: true,
        message: "Notification email added successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error adding email:", error);
      setEmailError(error.response?.data?.message || "Error adding email");
    }
  };

  // Handle removing a notification email address
  const handleRemoveEmail = async (emailToRemove) => {
    try {
      const response = await api.delete(
        `/v1/companies/${currentUser.company_id}/emails/${encodeURIComponent(emailToRemove)}`,
      );

      setNotificationEmails(response.data);

      setAlert({
        open: true,
        message: "Notification email removed successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error removing email:", error);
      setAlert({
        open: true,
        message: error.response?.data?.message || "Error removing email",
        severity: "error",
      });
    }
  };

  console.log("user_info: ", currentUser);

  return (
    <Box sx={{ p: 2 }}>
      <AlertMessage
        open={alert.open}
        onClose={handleAlertClose}
        severity={alert.severity}
        message={alert.message}
        autoHideDuration={6000}
      />

      <Typography variant="h5" sx={{ mb: 3, p: 2, borderRadius: 2, width: "fit-content" }}>
        My Profile
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <Avatar
                  sx={{ width: 64, height: 64, mr: 2, bgcolor: "primary.main" }}
                >
                  {currentUser?.name?.charAt(0) || <PersonIcon />}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {currentUser?.name || "User"}
                  </Typography>
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    sx={{ fontWeight: "medium" }}
                  >
                    {currentUser?.company_name || "No company associated"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {currentUser?.email || "user@example.com"}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <form onSubmit={profileFormik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label="Full Name"
                      value={profileFormik.values.name}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={
                        profileFormik.touched.name &&
                        Boolean(profileFormik.errors.name)
                      }
                      helperText={
                        profileFormik.touched.name && profileFormik.errors.name
                      }
                      margin="normal"
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-disabled": {
                            "& fieldset": {
                              borderColor: "rgba(0, 0, 0, 0.23)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(0, 0, 0, 0.23)",
                            },
                          },
                        },
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                          backgroundColor: "rgba(0, 0, 0, 0.07)",
                          cursor: "not-allowed",
                          borderRadius: "4px",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      disabled={true}
                      fullWidth
                      id="email"
                      name="email"
                      label="Email Address"
                      type="email"
                      value={profileFormik.values.email}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      error={
                        profileFormik.touched.email &&
                        Boolean(profileFormik.errors.email)
                      }
                      helperText={
                        profileFormik.touched.email &&
                        profileFormik.errors.email
                      }
                      margin="normal"
                      variant="outlined"
                      InputProps={{
                        readOnly: true,
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&.Mui-disabled": {
                            "& fieldset": {
                              borderColor: "rgba(0, 0, 0, 0.23)",
                            },
                            "&:hover fieldset": {
                              borderColor: "rgba(0, 0, 0, 0.23)",
                            },
                          },
                        },
                        "& .MuiInputBase-input.Mui-disabled": {
                          WebkitTextFillColor: "rgba(0, 0, 0, 0.87)",
                          backgroundColor: "rgba(0, 0, 0, 0.07)",
                          cursor: "not-allowed",
                          borderRadius: "4px",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Change Password */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <form onSubmit={passwordFormik.handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="current_password"
                      name="current_password"
                      label="Current Password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordFormik.values.current_password}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={
                        passwordFormik.touched.current_password &&
                        Boolean(passwordFormik.errors.current_password)
                      }
                      helperText={
                        passwordFormik.touched.current_password &&
                        passwordFormik.errors.current_password
                      }
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle current password visibility"
                              onClick={() =>
                                setShowCurrentPassword(!showCurrentPassword)
                              }
                              edge="end"
                            >
                              {showCurrentPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="new_password"
                      name="new_password"
                      label="New Password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordFormik.values.new_password}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={
                        passwordFormik.touched.new_password &&
                        Boolean(passwordFormik.errors.new_password)
                      }
                      helperText={
                        passwordFormik.touched.new_password &&
                        passwordFormik.errors.new_password
                      }
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle new password visibility"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              edge="end"
                            >
                              {showNewPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      id="confirm_password"
                      name="confirm_password"
                      label="Confirm New Password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordFormik.values.confirm_password}
                      onChange={passwordFormik.handleChange}
                      onBlur={passwordFormik.handleBlur}
                      error={
                        passwordFormik.touched.confirm_password &&
                        Boolean(passwordFormik.errors.confirm_password)
                      }
                      helperText={
                        passwordFormik.touched.confirm_password &&
                        passwordFormik.errors.confirm_password
                      }
                      disabled={loading}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle confirm password visibility"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              edge="end"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Box
                  sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}
                >
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || !passwordFormik.isValid}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Emails Section */}
      </Grid>
    </Box>
  );
};

export default Profile;

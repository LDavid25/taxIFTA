import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useParams } from "react-router-dom";
import { useSnackbar } from "notistack";
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Person as PersonIcon,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { getUserById } from "../services/userService";

// Validation schema
const validationSchema = Yup.object({
  name: Yup.string()
    .max(100, "Name cannot be longer than 100 characters")
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  email: Yup.string()
    .email("Please enter a valid email")
    .nullable()
    .transform((value) => (value === "" ? null : value)),
  password: Yup.string()
    .nullable()
    .transform((value) => (value === "" ? null : value)),
});

const UserEditForm = ({ user: userProp, onSubmit, loading: saving }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [showPassword, setShowPassword] = useState(false);

  // Debug log to verify user data
  // Handle nested user object
  const user = userProp?.user || userProp;

  // Initial form values based on user prop
  const initialValues = {
    name: user?.name || "",
    email: user?.email || "",
    is_active: user?.is_active ?? true,
    role: user?.role || "user",
    password: "",
  };

  // Form validation function
  const validate = (values) => {
    const errors = {};
    // Check that at least one field has a value
    const hasChanges = Object.entries(values).some(([key, value]) => {
      // Ignore is_active field in change verification
      if (key === "is_active") return false;
      return value !== null && value !== "" && value !== initialValues[key];
    });

    if (!hasChanges) {
      errors._form = "You must make at least one change to save";
    }

    return errors;
  };

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    validate,
    onSubmit: async (values, { setSubmitting }) => {
      if (saving) return; // Prevent multiple submissions
      try {
        // Filter only fields that have a value
        const changes = Object.entries(values).reduce((acc, [key, value]) => {
          if (value !== null && value !== "" && value !== initialValues[key]) {
            acc[key] = value;
          }
          return acc;
        }, {});

        await onSubmit(changes);
      } catch (error) {
        console.error("Error saving changes:", error);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // Fetch user data when component mounts
  // Update form values when user prop changes
  useEffect(() => {
    if (user) {
      const newValues = {
        name: user.name || "",
        email: user.email || "",
        is_active: user.is_active ?? true,
        role: user.role || "user",
        password: "",
      };
      formik.setValues(newValues);
    }
  }, [user]);

  console.log("[userEditForm]", user);
  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                mr: 2,
                bgcolor: "primary.main",
                fontSize: "2rem",
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || <PersonIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6">{user?.name || "User"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.company_name || "No asigned company"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email || "No email provided"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.role === "admin" ? "Administrator" : "User"}
              </Typography>
            </Box>
          </Box>

          <Typography variant="h6" gutterBottom>
            User Information
          </Typography>
          <Divider sx={{ mb: 3 }} />

          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Full Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="password"
                  name="password"
                  label="New Password (optional)"
                  type={showPassword ? "text" : "password"}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.password && Boolean(formik.errors.password)
                  }
                  helperText={formik.touched.password && formik.errors.password}
                  margin="normal"
                  variant="outlined"
                  placeholder="Leave blank to keep current password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal" variant="outlined">
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    id="is_active"
                    name="is_active"
                    value={formik.values.is_active}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label="Status"
                    disabled={user?.role === "admin"}
                  >
                    <MenuItem value={true}>
                      {user?.role === "admin" ? "Active (Admin)" : "Active"}
                    </MenuItem>
                    <MenuItem value={false}>
                      {user?.role === "admin" ? "Inactive (Admin)" : "Inactive"}
                    </MenuItem>
                  </Select>
                  {user?.role === "admin" && (
                    <FormHelperText>
                      Admin user status cannot be changed
                    </FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" mt={3}>
                  <Button
                    type="button"
                    variant="outlined"
                    color="primary"
                    onClick={() => window.history.back()}
                    sx={{ mr: 2 }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  {formik.errors._form && (
                    <Typography
                      color="error"
                      variant="body2"
                      sx={{ mt: 1, mb: 1 }}
                    >
                      {formik.errors._form}
                    </Typography>
                  )}
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={
                      saving ||
                      Object.keys(formik.touched).length === 0 ||
                      formik.errors._form
                    }
                    sx={{ mt: 2 }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserEditForm;

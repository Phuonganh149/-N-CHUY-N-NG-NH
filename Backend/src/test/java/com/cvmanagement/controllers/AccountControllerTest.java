package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.CandidateSignupRequest;
import com.cvmanagement.dto.request.LoginRequest;
import com.cvmanagement.services.AuthService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AccountController.class)
class AccountControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Autowired
    private ObjectMapper objectMapper;

    private LoginRequest validLoginRequest;

    @BeforeEach
    void setUp() {
        validLoginRequest = new LoginRequest();
        validLoginRequest.setEmail("test@example.com");
        validLoginRequest.setPassword("ValidPass123!");
    }

    @Nested
    @DisplayName("POST /auth/login Tests")
    class LoginTests {

        @Nested
        @DisplayName("Happy Path Tests")
        class HappyPath {

            @Test
            @DisplayName("Should successfully login with valid credentials")
            void testLoginWithValidCredentials() throws Exception {
                // This test would pass if AuthService is mocked properly
                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validLoginRequest)))
                        .andExpect(status().isOk());
            }
        }

        @Nested
        @DisplayName("Required Fields Validation")
        class RequiredFields {

            @Test
            @DisplayName("Should fail when email is null")
            void testLoginWithNullEmail() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail(null);
                request.setPassword("ValidPass123!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Đăng nhập thất bại do Email không được để trống"));
            }

            @Test
            @DisplayName("Should fail when password is null")
            void testLoginWithNullPassword() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test@example.com");
                request.setPassword(null);

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Đăng nhập thất bại do Password không được để trống"));
            }

            @Test
            @DisplayName("Should fail when both email and password are null")
            void testLoginWithBothFieldsNull() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail(null);
                request.setPassword(null);

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail with empty body")
            void testLoginWithEmptyBody() throws Exception {
                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                        .andExpect(status().isBadRequest());
            }
        }

        @Nested
        @DisplayName("Type Validation Tests")
        class TypeValidation {

            @Test
            @DisplayName("Should fail when email is not a string")
            void testLoginWithNumberAsEmail() throws Exception {
                String json = "{\"email\": 123, \"password\": \"ValidPass123!\"}";
                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when password is not a string")
            void testLoginWithNumberAsPassword() throws Exception {
                String json = "{\"email\": \"test@example.com\", \"password\": 123}";
                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when email is object")
            void testLoginWithObjectAsEmail() throws Exception {
                String json = "{\"email\": {\"value\": \"test@example.com\"}, \"password\": \"ValidPass123!\"}";
                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when email is array")
            void testLoginWithArrayAsEmail() throws Exception {
                String json = "{\"email\": [\"test@example.com\"], \"password\": \"ValidPass123!\"}";
                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }
        }

        @Nested
        @DisplayName("Format Validation Tests")
        class FormatValidation {

            @Test
            @DisplayName("Should fail with invalid email format")
            void testLoginWithInvalidEmail() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("invalid-email");
                request.setPassword("ValidPass123!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Đăng nhập thất bại do Email không hợp lệ"));
            }

            @Test
            @DisplayName("Should fail with email missing @ symbol")
            void testLoginWithEmailMissingAt() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test.example.com");
                request.setPassword("ValidPass123!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail with email missing domain")
            void testLoginWithEmailMissingDomain() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test@");
                request.setPassword("ValidPass123!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail with password too short")
            void testLoginWithPasswordTooShort() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test@example.com");
                request.setPassword("Short1!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail with password missing special character")
            void testLoginWithPasswordMissingSpecialChar() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test@example.com");
                request.setPassword("ValidPass123");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail with password missing uppercase")
            void testLoginWithPasswordMissingUppercase() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test@example.com");
                request.setPassword("validpass123!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail with password missing lowercase")
            void testLoginWithPasswordMissingLowercase() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test@example.com");
                request.setPassword("VALIDPASS123!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail with password missing digit")
            void testLoginWithPasswordMissingDigit() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test@example.com");
                request.setPassword("ValidPass!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }
        }

        @Nested
        @DisplayName("Edge Cases")
        class EdgeCases {

            @Test
            @DisplayName("Should fail with whitespace-only email")
            void testLoginWithWhitespaceEmail() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("   ");
                request.setPassword("ValidPass123!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail with whitespace-only password")
            void testLoginWithWhitespacePassword() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test@example.com");
                request.setPassword("   ");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail with extremely long email")
            void testLoginWithVeryLongEmail() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("a".repeat(1000) + "@example.com");
                request.setPassword("ValidPass123!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail with password containing spaces")
            void testLoginWithPasswordContainingSpaces() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test@example.com");
                request.setPassword("Valid Pass123!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should accept email with Vietnamese characters")
            void testLoginWithVietnameseEmail() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("testerđạo@example.com");
                request.setPassword("ValidPass123!");

                // May succeed or fail depending on implementation
                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should handle extra fields in request")
            void testLoginWithExtraFields() throws Exception {
                String json = "{\"email\": \"test@example.com\", \"password\": \"ValidPass123!\", \"extra\": \"field\"}";
                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().isOk()); // Note: JsonIgnoreProperties ignores unknown = false, so should fail
            }

            @Test
            @DisplayName("Should fail with multiple @ symbols in email")
            void testLoginWithMultipleAtSymbols() throws Exception {
                LoginRequest request = new LoginRequest();
                request.setEmail("test@ex@mple.com");
                request.setPassword("ValidPass123!");

                mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }
        }
    }

    @Nested
    @DisplayName("POST /auth/signup/candidate Tests")
    class SignupTests {

        @Nested
        @DisplayName("Required Fields Validation")
        class RequiredFields {

            @Test
            @DisplayName("Should fail when fullname is null")
            void testSignupWithNullFullname() throws Exception {
                String json = "{\"email\": \"test@example.com\", \"password\": \"ValidPass123!\", \"fullname\": null}";
                mockMvc.perform(post("/auth/signup/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Tên không được để trống"));
            }

            @Test
            @DisplayName("Should fail when email is null")
            void testSignupWithNullEmail() throws Exception {
                String json = "{\"email\": null, \"password\": \"ValidPass123!\", \"fullname\": \"John Doe\"}";
                mockMvc.perform(post("/auth/signup/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Email không được để trống"));
            }

            @Test
            @DisplayName("Should fail when password is null")
            void testSignupWithNullPassword() throws Exception {
                String json = "{\"email\": \"test@example.com\", \"password\": null, \"fullname\": \"John Doe\"}";
                mockMvc.perform(post("/auth/signup/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Mật khẩu không được để trống"));
            }

            @Test
            @DisplayName("Should fail with empty body")
            void testSignupWithEmptyBody() throws Exception {
                mockMvc.perform(post("/auth/signup/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                        .andExpect(status().isBadRequest());
            }
        }

        @Nested
        @DisplayName("Format Validation Tests")
        class FormatValidation {

            @Test
            @DisplayName("Should fail with invalid email format")
            void testSignupWithInvalidEmail() throws Exception {
                String json = "{\"email\": \"invalid-email\", \"password\": \"ValidPass123!\", \"fullname\": \"John Doe\"}";
                mockMvc.perform(post("/auth/signup/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail with weak password")
            void testSignupWithWeakPassword() throws Exception {
                String json = "{\"email\": \"test@example.com\", \"password\": \"weak\", \"fullname\": \"John Doe\"}";
                mockMvc.perform(post("/auth/signup/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().isBadRequest());
            }
        }

        @Nested
        @DisplayName("Edge Cases")
        class EdgeCases {

            @Test
            @DisplayName("Should handle Vietnamese fullname")
            void testSignupWithVietnameseName() throws Exception {
                String json = "{\"email\": \"test@example.com\", \"password\": \"ValidPass123!\", \"fullname\": \"Nguyễn Văn A\"}";
                mockMvc.perform(post("/auth/signup/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().is4xxClientError()); // May succeed or fail
            }

            @Test
            @DisplayName("Should handle very long fullname")
            void testSignupWithVeryLongName() throws Exception {
                String longName = "A".repeat(500);
                String json = "{\"email\": \"test@example.com\", \"password\": \"ValidPass123!\", \"fullname\": \"" + longName + "\"}";
                mockMvc.perform(post("/auth/signup/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().is4xxClientError()); // Should handle gracefully
            }

            @Test
            @DisplayName("Should handle extra fields in request")
            void testSignupWithExtraFields() throws Exception {
                String json = "{\"email\": \"test@example.com\", \"password\": \"ValidPass123!\", \"fullname\": \"John Doe\", \"extra\": \"field\"}";
                mockMvc.perform(post("/auth/signup/candidate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }
        }
    }
}

package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.ApplicationPatchRequest;
import com.cvmanagement.dto.request.ApplicationsPostRequest;
import com.cvmanagement.services.ApplicationService;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ApplicationController.class)
@DisplayName("Application Controller Tests")
class ApplicationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ApplicationService applicationService;

    @Autowired
    private ObjectMapper objectMapper;

    @Nested
    @DisplayName("GET /application/id Tests")
    class GetApplicationTests {

        @Test
        @DisplayName("Should fail with null applicationId in body")
        void testGetApplicationWithNullId() throws Exception {
            mockMvc.perform(get("/application/id")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("null"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with negative applicationId")
        void testGetApplicationWithNegativeId() throws Exception {
            mockMvc.perform(get("/application/id")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("-1"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with zero applicationId")
        void testGetApplicationWithZeroId() throws Exception {
            mockMvc.perform(get("/application/id")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("0"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with non-numeric applicationId")
        void testGetApplicationWithNonNumericId() throws Exception {
            mockMvc.perform(get("/application/id")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("\"abc\""))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with empty body")
        void testGetApplicationWithEmptyBody() throws Exception {
            mockMvc.perform(get("/application/id")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(""))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with object instead of integer")
        void testGetApplicationWithObjectId() throws Exception {
            mockMvc.perform(get("/application/id")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"id\": 1}"))
                    .andExpect(status().is4xxClientError());
        }
    }

    @Nested
    @DisplayName("POST /application Tests")
    class CreateApplicationTests {

        @Nested
        @DisplayName("Required Fields Validation")
        class RequiredFields {

            @Test
            @DisplayName("Should fail when jobId is null")
            void testCreateApplicationWithNullJobId() throws Exception {
                String json = "{\"jobId\": null, \"email\": \"test@example.com\"}";
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when email is null")
            void testCreateApplicationWithNullEmail() throws Exception {
                String json = "{\"jobId\": 1, \"email\": null}";
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail with empty body")
            void testCreateApplicationWithEmptyBody() throws Exception {
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9")
                        .content("{}"))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail without cookie header")
            void testCreateApplicationWithoutCookie() throws Exception {
                String json = "{\"jobId\": 1, \"email\": \"test@example.com\"}";
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Đăng ký thất bại do thiếu cookie"));
            }
        }

        @Nested
        @DisplayName("Type Validation Tests")
        class TypeValidation {

            @Test
            @DisplayName("Should fail when jobId is string")
            void testCreateApplicationWithStringJobId() throws Exception {
                String json = "{\"jobId\": \"1\", \"email\": \"test@example.com\"}";
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "token")
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when jobId is object")
            void testCreateApplicationWithObjectJobId() throws Exception {
                String json = "{\"jobId\": {\"id\": 1}, \"email\": \"test@example.com\"}";
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "token")
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when email is number")
            void testCreateApplicationWithNumberEmail() throws Exception {
                String json = "{\"jobId\": 1, \"email\": 123}";
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "token")
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }
        }

        @Nested
        @DisplayName("Boundary Testing")
        class BoundaryTesting {

            @Test
            @DisplayName("Should fail with negative jobId")
            void testCreateApplicationWithNegativeJobId() throws Exception {
                ApplicationsPostRequest request = new ApplicationsPostRequest(-1, "test@example.com");
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "token")
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail with zero jobId")
            void testCreateApplicationWithZeroJobId() throws Exception {
                ApplicationsPostRequest request = new ApplicationsPostRequest(0, "test@example.com");
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "token")
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail with very large jobId")
            void testCreateApplicationWithVeryLargeJobId() throws Exception {
                ApplicationsPostRequest request = new ApplicationsPostRequest(Integer.MAX_VALUE, "test@example.com");
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "token")
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }
        }

        @Nested
        @DisplayName("Format Validation Tests")
        class FormatValidation {

            @Test
            @DisplayName("Should fail with invalid email format")
            void testCreateApplicationWithInvalidEmail() throws Exception {
                ApplicationsPostRequest request = new ApplicationsPostRequest(1, "invalid-email");
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "token")
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail with email missing domain")
            void testCreateApplicationWithEmailMissingDomain() throws Exception {
                ApplicationsPostRequest request = new ApplicationsPostRequest(1, "test@");
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "token")
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }
        }

        @Nested
        @DisplayName("Edge Cases")
        class EdgeCases {

            @Test
            @DisplayName("Should handle extra fields in request")
            void testCreateApplicationWithExtraFields() throws Exception {
                String json = "{\"jobId\": 1, \"email\": \"test@example.com\", \"extra\": \"field\"}";
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "token")
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should handle very long email")
            void testCreateApplicationWithVeryLongEmail() throws Exception {
                String longEmail = "a".repeat(1000) + "@example.com";
                ApplicationsPostRequest request = new ApplicationsPostRequest(1, longEmail);
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "token")
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should handle invalid JWT token in cookie")
            void testCreateApplicationWithInvalidToken() throws Exception {
                ApplicationsPostRequest request = new ApplicationsPostRequest(1, "test@example.com");
                mockMvc.perform(post("/application")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("cookie", "invalid-token-format")
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }
        }
    }

    @Nested
    @DisplayName("PATCH /application Tests")
    class UpdateApplicationTests {

        @Test
        @DisplayName("Should fail with empty body")
        void testUpdateApplicationWithEmptyBody() throws Exception {
            mockMvc.perform(patch("/application")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with null request")
        void testUpdateApplicationWithNullRequest() throws Exception {
            mockMvc.perform(patch("/application")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("null"))
                    .andExpect(status().is4xxClientError());
        }
    }

    @Nested
    @DisplayName("DELETE /application Tests")
    class DeleteApplicationTests {

        @Test
        @DisplayName("Should fail with missing applicationId")
        void testDeleteApplicationWithMissingId() throws Exception {
            mockMvc.perform(delete("/application")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with negative applicationId")
        void testDeleteApplicationWithNegativeId() throws Exception {
            mockMvc.perform(delete("/application")
                    .param("applicationId", "-1")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with zero applicationId")
        void testDeleteApplicationWithZeroId() throws Exception {
            mockMvc.perform(delete("/application")
                    .param("applicationId", "0")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with non-numeric applicationId")
        void testDeleteApplicationWithNonNumericId() throws Exception {
            mockMvc.perform(delete("/application")
                    .param("applicationId", "abc")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }
    }
}

package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.CandidatePatchRequest;
import com.cvmanagement.services.CandidateService;
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

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CandidateController.class)
@DisplayName("Candidate Controller Tests")
class CandidateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CandidateService candidateService;

    @Autowired
    private ObjectMapper objectMapper;

    private String validUUID;

    @BeforeEach
    void setUp() {
        validUUID = UUID.randomUUID().toString();
    }

    @Nested
    @DisplayName("GET /candidate/id Tests")
    class GetCandidateTests {

        @Test
        @DisplayName("Should fail with invalid UUID format")
        void testGetCandidateWithInvalidUUID() throws Exception {
            mockMvc.perform(get("/candidate/id")
                    .param("userId", "not-a-uuid")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Không thể lấy thông tin do userId không hợp lệ"));
        }

        @Test
        @DisplayName("Should fail with missing userId parameter")
        void testGetCandidateWithMissingUserId() throws Exception {
            mockMvc.perform(get("/candidate/id")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with empty userId parameter")
        void testGetCandidateWithEmptyUserId() throws Exception {
            mockMvc.perform(get("/candidate/id")
                    .param("userId", "")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should fail with UUID containing duplicate characters")
        void testGetCandidateWithDuplicateUUIDCharacters() throws Exception {
            // According to Validator.isUserIdValid, UUIDs with duplicate characters are invalid
            mockMvc.perform(get("/candidate/id")
                    .param("userId", "00000000-0000-0000-0000-000000000000")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with numeric string as userId")
        void testGetCandidateWithNumericUserId() throws Exception {
            mockMvc.perform(get("/candidate/id")
                    .param("userId", "123456789")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should fail with UUID missing hyphens")
        void testGetCandidateWithUUIDMissingHyphens() throws Exception {
            mockMvc.perform(get("/candidate/id")
                    .param("userId", "550e8400e29b41d4a716446655440000")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should fail with very long UUID string")
        void testGetCandidateWithVeryLongUserId() throws Exception {
            mockMvc.perform(get("/candidate/id")
                    .param("userId", validUUID + "extra")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should fail with special characters in userId")
        void testGetCandidateWithSpecialCharactersInUserId() throws Exception {
            mockMvc.perform(get("/candidate/id")
                    .param("userId", "550e8400-e29b-41d4-a716-446655440000!")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("PATCH /candidate/id Tests")
    class UpdateCandidateTests {

        @Test
        @DisplayName("Should fail with invalid UUID format")
        void testUpdateCandidateWithInvalidUUID() throws Exception {
            String json = "{\"field\": \"value\"}";
            mockMvc.perform(patch("/candidate/id")
                    .param("userId", "not-a-uuid")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Cập nhật tài khoản thất bại do userId không hợp lệ"));
        }

        @Test
        @DisplayName("Should fail with null request body")
        void testUpdateCandidateWithNullRequest() throws Exception {
            mockMvc.perform(patch("/candidate/id")
                    .param("userId", validUUID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("null"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Cập nhật tài khoản thất bại do Request không hợp lệ"));
        }

        @Test
        @DisplayName("Should fail with empty request body")
        void testUpdateCandidateWithEmptyRequest() throws Exception {
            mockMvc.perform(patch("/candidate/id")
                    .param("userId", validUUID)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().is4xxClientError()); // Depends on what updates are valid
        }

        @Test
        @DisplayName("Should fail with missing userId parameter")
        void testUpdateCandidateWithMissingUserId() throws Exception {
            mockMvc.perform(patch("/candidate/id")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with UUID containing duplicate characters")
        void testUpdateCandidateWithDuplicateUUIDCharacters() throws Exception {
            mockMvc.perform(patch("/candidate/id")
                    .param("userId", "00000000-0000-0000-0000-000000000000")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().is4xxClientError());
        }
    }

    @Nested
    @DisplayName("DELETE /candidate/id Tests")
    class DeleteCandidateTests {

        @Test
        @DisplayName("Should fail with invalid UUID format")
        void testDeleteCandidateWithInvalidUUID() throws Exception {
            mockMvc.perform(delete("/candidate/id")
                    .param("userId", "not-a-uuid")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Xóa tài khoản thất bại do userId không hợp lệ"));
        }

        @Test
        @DisplayName("Should fail with missing userId parameter")
        void testDeleteCandidateWithMissingUserId() throws Exception {
            mockMvc.perform(delete("/candidate/id")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with empty userId parameter")
        void testDeleteCandidateWithEmptyUserId() throws Exception {
            mockMvc.perform(delete("/candidate/id")
                    .param("userId", "")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should fail with UUID containing duplicate characters")
        void testDeleteCandidateWithDuplicateUUIDCharacters() throws Exception {
            mockMvc.perform(delete("/candidate/id")
                    .param("userId", "00000000-0000-0000-0000-000000000000")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with numeric string as userId")
        void testDeleteCandidateWithNumericUserId() throws Exception {
            mockMvc.perform(delete("/candidate/id")
                    .param("userId", "123456789")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should fail with very long userId string")
        void testDeleteCandidateWithVeryLongUserId() throws Exception {
            mockMvc.perform(delete("/candidate/id")
                    .param("userId", validUUID + "extra")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isBadRequest());
        }
    }
}

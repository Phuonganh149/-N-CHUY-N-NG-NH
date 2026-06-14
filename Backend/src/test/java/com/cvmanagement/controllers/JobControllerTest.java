package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.JobPatchRequest;
import com.cvmanagement.dto.request.JobPostRequest;
import com.cvmanagement.services.JobService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(JobController.class)
@DisplayName("Job Controller Tests")
class JobControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private JobService jobService;

    @Autowired
    private ObjectMapper objectMapper;

    private JobPostRequest validJobRequest;

    @BeforeEach
    void setUp() {
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        validJobRequest = new JobPostRequest(
                "Senior Software Engineer Position",
                "TechCorp Company",
                "Hanoi",
                "20000000-25000000",
                LocalDate.now().plusDays(30),
                5,
                "Java,Spring,Docker"
        );
    }

    @Nested
    @DisplayName("GET /job/id Tests")
    class GetJobTests {

        @Test
        @DisplayName("Should fail with negative jobId")
        void testGetJobWithNegativeId() throws Exception {
            mockMvc.perform(get("/job/id")
                    .param("jobId", "-1")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with zero jobId")
        void testGetJobWithZeroId() throws Exception {
            mockMvc.perform(get("/job/id")
                    .param("jobId", "0")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with very large jobId")
        void testGetJobWithVeryLargeId() throws Exception {
            mockMvc.perform(get("/job/id")
                    .param("jobId", String.valueOf(Long.MAX_VALUE))
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with non-numeric jobId")
        void testGetJobWithNonNumericId() throws Exception {
            mockMvc.perform(get("/job/id")
                    .param("jobId", "abc")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with missing jobId parameter")
        void testGetJobWithMissingId() throws Exception {
            mockMvc.perform(get("/job/id")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with empty jobId parameter")
        void testGetJobWithEmptyId() throws Exception {
            mockMvc.perform(get("/job/id")
                    .param("jobId", "")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }
    }

    @Nested
    @DisplayName("POST /job Tests")
    class CreateJobTests {

        @Nested
        @DisplayName("Required Fields Validation")
        class RequiredFields {

            @Test
            @DisplayName("Should fail when title is null")
            void testCreateJobWithNullTitle() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        null,
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Không thể tạo công việc do tiêu đề không được để trống"));
            }

            @Test
            @DisplayName("Should fail when location is null")
            void testCreateJobWithNullLocation() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        null,
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Không thể tạo công việc do tên công ty không được để trống"));
            }

            @Test
            @DisplayName("Should fail when deadline is null")
            void testCreateJobWithNullDeadline() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        null,
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Không thể tạo công việc do ngày hết hạn không được để trống"));
            }

            @Test
            @DisplayName("Should fail with empty body")
            void testCreateJobWithEmptyBody() throws Exception {
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                        .andExpect(status().isBadRequest());
            }
        }

        @Nested
        @DisplayName("Type Validation Tests")
        class TypeValidation {

            @Test
            @DisplayName("Should fail when title is number")
            void testCreateJobWithNumberTitle() throws Exception {
                String json = "{\"title\": 123, \"company\": \"TechCorp\", \"location\": \"Hanoi\", \"salary\": \"20000000-25000000\", \"deadline\": \"2025-01-01\", \"quantity\": 5, \"tags\": \"Java\"}";
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when quantity is string")
            void testCreateJobWithStringQuantity() throws Exception {
                String json = "{\"title\": \"Senior Engineer\", \"company\": \"TechCorp\", \"location\": \"Hanoi\", \"salary\": \"20000000-25000000\", \"deadline\": \"2025-01-01\", \"quantity\": \"five\", \"tags\": \"Java\"}";
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().is4xxClientError());
            }
        }

        @Nested
        @DisplayName("Boundary Testing")
        class BoundaryTesting {

            @Test
            @DisplayName("Should fail when quantity is less than 2")
            void testCreateJobWithQuantityLessThanTwo() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        1,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail when quantity is zero")
            void testCreateJobWithZeroQuantity() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        0,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail when quantity is negative")
            void testCreateJobWithNegativeQuantity() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        -5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail when deadline is in past")
            void testCreateJobWithPastDeadline() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().minusDays(5),
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when deadline is less than 2 days from now")
            void testCreateJobWithDeadlineLessThanTwoDays() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(1),
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when title is too short")
            void testCreateJobWithShortTitle() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Short",
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }
        }

        @Nested
        @DisplayName("Format Validation Tests")
        class FormatValidation {

            @Test
            @DisplayName("Should fail when location is invalid enum value")
            void testCreateJobWithInvalidLocation() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        "InvalidCity",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when company name contains numbers")
            void testCreateJobWithNumberInCompanyName() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp123 Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail when company name is too short")
            void testCreateJobWithShortCompanyName() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TC",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }

            @Test
            @DisplayName("Should fail when title contains special characters")
            void testCreateJobWithSpecialCharactersInTitle() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior@Software#Engineer!Position",
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().isBadRequest());
            }
        }

        @Nested
        @DisplayName("Edge Cases")
        class EdgeCases {

            @Test
            @DisplayName("Should handle very large quantity")
            void testCreateJobWithVeryLargeQuantity() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        999999,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError()); // May or may not validate
            }

            @Test
            @DisplayName("Should handle null salary (optional field)")
            void testCreateJobWithNullSalary() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        "Hanoi",
                        null,
                        LocalDate.now().plusDays(30),
                        5,
                        "Java,Spring"
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError()); // Depends on implementation
            }

            @Test
            @DisplayName("Should handle extra fields in request")
            void testCreateJobWithExtraFields() throws Exception {
                String json = "{\"title\": \"Senior Engineer\", \"company\": \"TechCorp\", \"location\": \"Hanoi\", \"salary\": \"20000000\", \"deadline\": \"2025-12-31\", \"quantity\": 5, \"tags\": \"Java\", \"extra\": \"field\"}";
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                        .andExpect(status().is4xxClientError()); // Depends on JsonIgnoreProperties
            }

            @Test
            @DisplayName("Should handle very long tag string")
            void testCreateJobWithVeryLongTags() throws Exception {
                JobPostRequest request = new JobPostRequest(
                        "Senior Software Engineer Position",
                        "TechCorp Company",
                        "Hanoi",
                        "20000000-25000000",
                        LocalDate.now().plusDays(30),
                        5,
                        "a".repeat(5000)
                );
                mockMvc.perform(post("/job")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                        .andExpect(status().is4xxClientError()); // Should handle gracefully
            }
        }
    }

    @Nested
    @DisplayName("PATCH /job/{jobId} Tests")
    class UpdateJobTests {

        @Test
        @DisplayName("Should fail with null request")
        void testUpdateJobWithNullRequest() throws Exception {
            mockMvc.perform(patch("/job/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("null"))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with empty request body")
        void testUpdateJobWithEmptyRequest() throws Exception {
            mockMvc.perform(patch("/job/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("Should fail with negative jobId")
        void testUpdateJobWithNegativeId() throws Exception {
            String json = "{\"title\": \"Updated Title\"}";
            mockMvc.perform(patch("/job/-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with zero jobId")
        void testUpdateJobWithZeroId() throws Exception {
            String json = "{\"title\": \"Updated Title\"}";
            mockMvc.perform(patch("/job/0")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with non-numeric jobId")
        void testUpdateJobWithNonNumericId() throws Exception {
            String json = "{\"title\": \"Updated Title\"}";
            mockMvc.perform(patch("/job/abc")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().is4xxClientError());
        }
    }

    @Nested
    @DisplayName("DELETE /job Tests")
    class DeleteJobTests {

        @Test
        @DisplayName("Should fail with negative jobId")
        void testDeleteJobWithNegativeId() throws Exception {
            mockMvc.perform(delete("/job")
                    .param("jobId", "-1")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with zero jobId")
        void testDeleteJobWithZeroId() throws Exception {
            mockMvc.perform(delete("/job")
                    .param("jobId", "0")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with non-numeric jobId")
        void testDeleteJobWithNonNumericId() throws Exception {
            mockMvc.perform(delete("/job")
                    .param("jobId", "abc")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with missing jobId")
        void testDeleteJobWithMissingId() throws Exception {
            mockMvc.perform(delete("/job")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }
    }
}

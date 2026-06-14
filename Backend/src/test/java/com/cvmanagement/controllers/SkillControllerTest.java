package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.SkillPatchRequest;
import com.cvmanagement.services.SkillService;
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

@WebMvcTest(SkillController.class)
@DisplayName("Skill Controller Tests")
class SkillControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SkillService skillService;

    @Autowired
    private ObjectMapper objectMapper;

    @Nested
    @DisplayName("POST /skill Tests")
    class CreateSkillTests {

        @Nested
        @DisplayName("Required Fields Validation")
        class RequiredFields {

            @Test
            @DisplayName("Should fail with null skill name")
            void testCreateSkillWithNullName() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("null"))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail with empty request body")
            void testCreateSkillWithEmptyBody() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""))
                        .andExpect(status().is4xxClientError());
            }
        }

        @Nested
        @DisplayName("Type Validation Tests")
        class TypeValidation {

            @Test
            @DisplayName("Should fail when skill name is number")
            void testCreateSkillWithNumberName() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("123"))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when skill name is object")
            void testCreateSkillWithObjectName() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Java\"}"))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail when skill name is array")
            void testCreateSkillWithArrayName() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[\"Java\"]"))
                        .andExpect(status().is4xxClientError());
            }
        }

        @Nested
        @DisplayName("Boundary Testing")
        class BoundaryTesting {

            @Test
            @DisplayName("Should fail with empty string")
            void testCreateSkillWithEmptyString() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"\""))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Không thể tạo skill do tên kỹ năng không được để trống"));
            }

            @Test
            @DisplayName("Should fail with whitespace only")
            void testCreateSkillWithWhitespaceOnly() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"   \""))
                        .andExpect(status().is4xxClientError());
            }

            @Test
            @DisplayName("Should fail with single character")
            void testCreateSkillWithSingleCharacter() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"A\""))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Không thể tạo skill do tên kỹ năng không được ngắn hơn 2 ký tự"));
            }

            @Test
            @DisplayName("Should fail with name longer than 20 characters")
            void testCreateSkillWithVeryLongName() throws Exception {
                String longName = "\"" + "a".repeat(50) + "\"";
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(longName))
                        .andExpect(status().isBadRequest());
            }
        }

        @Nested
        @DisplayName("Format Validation Tests")
        class FormatValidation {

            @Test
            @DisplayName("Should fail with leading special character")
            void testCreateSkillWithLeadingSpecialChar() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"@Java\""))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Không thể tạo skill do tên kỹ năng không được bắt đầu bằng ký tự đặc biệt"));
            }

            @Test
            @DisplayName("Should fail with trailing special character")
            void testCreateSkillWithTrailingSpecialChar() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"Java@\""))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Không thể tạo skill do tên kỹ năng không được kết thúc bằng ký tự đặc biệt"));
            }

            @Test
            @DisplayName("Should fail with double spaces")
            void testCreateSkillWithDoubleSpaces() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"Java  Script\""))
                        .andExpect(status().isBadRequest())
                        .andExpect(content().string("Không thể tạo skill do tên kỹ năng không được chứa khoảng trắng liên tiếp"));
            }

            @Test
            @DisplayName("Should fail with only special characters")
            void testCreateSkillWithOnlySpecialChars() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"@#$%\""))
                        .andExpect(status().isBadRequest());
            }
        }

        @Nested
        @DisplayName("Edge Cases")
        class EdgeCases {

            @Test
            @DisplayName("Should accept skill with numbers")
            void testCreateSkillWithNumbers() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"C++\""))
                        .andExpect(status().isOk());
            }

            @Test
            @DisplayName("Should accept skill with hash")
            void testCreateSkillWithHash() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"C#\""))
                        .andExpect(status().isOk());
            }

            @Test
            @DisplayName("Should accept skill with slash")
            void testCreateSkillWithSlash() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"Objective-C\""))
                        .andExpect(status().isOk());
            }

            @Test
            @DisplayName("Should handle Vietnamese skill names")
            void testCreateSkillWithVietnameseName() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"Lập trình Java\""))
                        .andExpect(status().is4xxClientError()); // Vietnamese chars may not be allowed
            }

            @Test
            @DisplayName("Should handle quoted content")
            void testCreateSkillWithInnerQuotes() throws Exception {
                mockMvc.perform(post("/skill")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"Java \\\"Script\\\"\""))
                        .andExpect(status().is4xxClientError());
            }
        }
    }

    @Nested
    @DisplayName("GET /skill/{skillId} Tests")
    class GetSkillTests {

        @Test
        @DisplayName("Should fail with negative skillId")
        void testGetSkillWithNegativeId() throws Exception {
            mockMvc.perform(get("/skill/-1")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with zero skillId")
        void testGetSkillWithZeroId() throws Exception {
            mockMvc.perform(get("/skill/0")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with non-numeric skillId")
        void testGetSkillWithNonNumericId() throws Exception {
            mockMvc.perform(get("/skill/abc")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with very large skillId")
        void testGetSkillWithVeryLargeId() throws Exception {
            mockMvc.perform(get("/skill/" + Long.MAX_VALUE)
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }
    }

    @Nested
    @DisplayName("PATCH /skill/{skillId} Tests")
    class UpdateSkillTests {

        @Test
        @DisplayName("Should fail with negative skillId")
        void testUpdateSkillWithNegativeId() throws Exception {
            String json = "{\"name\": \"UpdatedSkill\"}";
            mockMvc.perform(patch("/skill/-1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with zero skillId")
        void testUpdateSkillWithZeroId() throws Exception {
            String json = "{\"name\": \"UpdatedSkill\"}";
            mockMvc.perform(patch("/skill/0")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with null request")
        void testUpdateSkillWithNullRequest() throws Exception {
            mockMvc.perform(patch("/skill/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("null"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Không thể cập nhật skill do request không hợp lệ"));
        }

        @Test
        @DisplayName("Should fail with empty request body")
        void testUpdateSkillWithEmptyBody() throws Exception {
            mockMvc.perform(patch("/skill/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(content().string("Không thể cập nhật skill do request không hợp lệ"));
        }

        @Test
        @DisplayName("Should fail with non-numeric skillId")
        void testUpdateSkillWithNonNumericId() throws Exception {
            String json = "{\"name\": \"UpdatedSkill\"}";
            mockMvc.perform(patch("/skill/abc")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with empty string for name")
        void testUpdateSkillWithEmptyName() throws Exception {
            String json = "{\"name\": \"\"}";
            mockMvc.perform(patch("/skill/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with name too short")
        void testUpdateSkillWithTooShortName() throws Exception {
            String json = "{\"name\": \"A\"}";
            mockMvc.perform(patch("/skill/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with name too long")
        void testUpdateSkillWithTooLongName() throws Exception {
            String longName = "a".repeat(100);
            String json = "{\"name\": \"" + longName + "\"}";
            mockMvc.perform(patch("/skill/1")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(json))
                    .andExpect(status().is4xxClientError());
        }
    }

    @Nested
    @DisplayName("DELETE /skill/{skillId} Tests")
    class DeleteSkillTests {

        @Test
        @DisplayName("Should fail with negative skillId")
        void testDeleteSkillWithNegativeId() throws Exception {
            mockMvc.perform(delete("/skill/-1")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with zero skillId")
        void testDeleteSkillWithZeroId() throws Exception {
            mockMvc.perform(delete("/skill/0")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with non-numeric skillId")
        void testDeleteSkillWithNonNumericId() throws Exception {
            mockMvc.perform(delete("/skill/abc")
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }

        @Test
        @DisplayName("Should fail with very large skillId")
        void testDeleteSkillWithVeryLargeId() throws Exception {
            mockMvc.perform(delete("/skill/" + Long.MAX_VALUE)
                    .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().is4xxClientError());
        }
    }
}

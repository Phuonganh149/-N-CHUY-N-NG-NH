package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.SkillPatchRequest;
import com.cvmanagement.dto.request.SkillPostRequest;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.services.SkillService;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các yêu cầu liên quan đến kỹ năng (Skill).
 * <p>
 * Cung cấp các endpoint cho việc:
 * <ul>
 * <li>Tạo kỹ năng mới</li>
 * <li>Lấy thông tin kỹ năng</li>
 * <li>Cập nhật thông tin kỹ năng</li>
 * <li>Xóa kỹ năng</li>
 * </ul>
 */
@RestController
@RequestMapping("/skill")
public class SkillController {
    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    /**
     * Tạo kỹ năng mới.
     *
     * @param newSkill chứa field cần để tạo mới skill
     * @return ResponseEntity với trạng thái tạo thành công hoặc lỗi
     */
    @PostMapping
    public ResponseEntity<String> newSkill(@RequestBody SkillPostRequest newSkill) {
        try {
            if (newSkill.skill_name() == null) throw new BusinessException("field tên skill không được để trống");
            skillService.create(newSkill);
            return new ResponseEntity<>("Tạo thành công", HttpStatusCode.valueOf(200));
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể tạo skill do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Lấy thông tin kỹ năng theo ID.
     *
     * @param skillId ID của kỹ năng cần lấy
     * @return ResponseEntity với đối tượng Skill hoặc lỗi
     */
    @GetMapping("/{skillId}")
    public ResponseEntity<Object> getSkill(@PathVariable int skillId) {
        try {
            return ResponseEntity.ok(skillService.get(skillId));
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể lấy skill do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Cập nhật thông tin kỹ năng theo ID.
     *
     * @param skillId ID của kỹ năng cần cập nhật
     * @param request chứa field cần cập nhật
     * @return ResponseEntity với thông báo thành công hoặc lỗi
     */
    @PatchMapping("/{skillId}")
    public ResponseEntity<String> updateSkill(@PathVariable int skillId, @RequestBody SkillPatchRequest request) {
        try {
            if (request == null || !request.isNameProvided()) {
                throw new BusinessException("request không hợp lệ");
            }
            skillService.update(skillId, request);
            return ResponseEntity.ok("Cập nhật thành công");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể cập nhật skill do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Xóa kỹ năng theo ID.
     *
     * @param skillId ID của kỹ năng cần xóa
     * @return ResponseEntity với thông báo thành công hoặc lỗi
     */
    @DeleteMapping("/{skillId}")
    public ResponseEntity<String> deleteSkill(@PathVariable int skillId) {
        try {
            skillService.delete(skillId);
            return ResponseEntity.ok("Xóa thành công");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể xóa skill do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }
}

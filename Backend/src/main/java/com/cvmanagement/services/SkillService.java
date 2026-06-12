package com.cvmanagement.services;

import com.cvmanagement.dto.request.SkillPatchRequest;
import com.cvmanagement.dto.request.SkillPostRequest;
import com.cvmanagement.entities.Skill;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.repositories.SkillRepo;
import com.cvmanagement.utilities.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;

import static com.cvmanagement.enums.DBSchema.Skills.SKILL_NAME;

/**
 * Service xử lý các nhân vụ liên quan đến kỹ năng (Skill).
 * <p>
 * Cung cấp các hàm cho việc:
 * <ul>
 * <li>Tạo kỹ năng mới</li>
 * <li>Lấy thông tin kỹ năng</li>
 * <li>Cập nhật kỹ năng</li>
 * <li>Xóa kỹ năng</li>
 * </ul>
 */
@Service
public class SkillService {
    private final SkillRepo skillRepo;

    public SkillService(SkillRepo skillRepo) {
        this.skillRepo = skillRepo;
    }

    private static final Logger log = LoggerFactory.getLogger(SkillService.class);

    /**
     * Tạo kỹ năng mới.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Xác thực tên kỹ năng</li>
     * <li>Tạo object Skill mới</li>
     * <li>Lưu dữ liệu vào database</li>
     * </ul>
     *
     * @param newSkill DTO request chứa thông tin kỹ năng cần tạo
     * @throws Exception khi dữ liệu không hợp lệ hoặc database lỗi
     */
    public void create(SkillPostRequest newSkill) throws Exception {
        try {
            // TODO: FIX BUG TÊN SKILL ĐÃ TỒN TẠI NHƯNG VẪN TẠO
            // TODO: FIX BUG TÊN SKILL ĐÃ TỒN TẠI NHƯNG VÂN TẠO ĐƯỢC NẾU TÊN MỚI CÓ NHIỀU KHOẢNG TRỐNG ĐẰNG SAU
            // TODO: FIX BUG TẾN KILL ĐÃ TỒN TẠI NHƯNG VẪN TẠO ĐƯỢC NẾU TÊN MỚI KHÁC CASE

            Validator.isSkillNameValid(newSkill.skill_name());
            skillRepo.create(new Skill(newSkill.skill_name()));

        } catch (BusinessException e) {
            log.error("Không thể tạo skill tên {} do {}", newSkill.skill_name(), e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (SQLException e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể tạo skill tên {} do {}. Source location: {}.{}.{}}", newSkill.skill_name(), e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e.getMessage());
        }
    }

    /**
     * Lấy thông tin kỹ năng theo ID.
     *
     * @param skillId ID của kỹ năng cần lấy
     * @return Skill chứa thông tin kỹ năng
     * @throws Exception khi kỹ năng không tồn tại hoặc database lỗi
     */
    public Skill get(int skillId) throws Exception {
        return skillRepo.read(skillId);
    }

    /**
     * Cập nhật thông tin kỹ năng.
     * <p>
     * Method này cho phép cập nhật: skillName.
     *
     * @param skillId ID của kỹ năng cần cập nhật
     * @param request chứa các field cần cập nhật
     * @throws Exception khi xảy ra lỗi database
     */
    public void update(int skillId, SkillPatchRequest request) throws Exception {
        Set<String> fields = new HashSet<>();
        try {
            Skill oldVal = skillRepo.read(skillId);
            if (request.isNameProvided()) {
                oldVal.setName(request.getName());
                fields.add((SKILL_NAME.value()));
            }

            if (!fields.isEmpty()) {
                skillRepo.update(skillId, oldVal, fields);
            }
        } catch (Exception e) {
            // TODO: Replace System.out.println with proper logging framework
            System.out.println(e.getMessage());
            throw new Exception("lỗi không xác định");
        }
    }

    /**
     * Xóa kỹ năng theo ID.
     *
     * @param skillId ID của kỹ năng cần xóa
     * @throws Exception khi xảy ra lỗi database
     */
    public void delete(int skillId) throws Exception {
        try {
            skillRepo.delete(skillId);
        } catch (SQLException e) {
            // TODO: Replace System.out.println with proper logging framework
            System.out.println(e.getMessage());
            throw new Exception("lỗi không xác định");
        }
    }
}

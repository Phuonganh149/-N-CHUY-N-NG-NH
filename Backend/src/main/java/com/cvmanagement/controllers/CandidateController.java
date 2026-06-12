package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.CandidatePatchRequest;
import com.cvmanagement.dto.response.CandidateGetResponse;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.services.CandidateService;
import com.cvmanagement.utilities.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static com.cvmanagement.enums.DBSchema.User.*;

/**
 * Controller xử lý các yêu cầu liên quan đến ứng viên (Candidate).
 * <p>
 * Cung cấp các endpoint cho việc:
 * <ul>
 * <li>Lấy thông tin ứng viên theo ID</li>
 * <li>Cập nhật thông tin ứng viên</li>
 * <li>Xóa tài khoản ứng viên</li>
 * </ul>
 */
@RestController
@RequestMapping("/candidate")
public class CandidateController {
    private final CandidateService candidateService;
    private static final Logger log = LoggerFactory.getLogger(CandidateController.class);

    public CandidateController(CandidateService candidateService) {
        this.candidateService = candidateService;
    }

    /**
     * Lấy thông tin ứng viên theo userId.
     * <p>
     * Controller sẽ validate UUID và trả về CandidateGetResponse khi tìm thấy.
     *
     * @param userId ID của ứng viên cần lấy
     * @return ResponseEntity chứa dữ liệu ứng viên hoặc lỗi
     */
    @GetMapping("/{userId}")
    public ResponseEntity<Object> getCandidate(@PathVariable String userId) {
        try {
            log.info("Nhận được yêu cầu lấy thông tin ứng viên {}", userId);
            Validator.isUserIdValid(userId);
            return ResponseEntity.ok(new CandidateGetResponse(candidateService.get(UUID.fromString(userId))));
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể lấy thông tin do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Cập nhật thông tin ứng viên.
     * <p>
     * Controller chỉ validate UUID và chuyển request patch đến service.
     *
     * @param userId ID của ứng viên cần cập nhật
     * @param input  chứa các field cần cập nhật
     * @return ResponseEntity với thông báo thành công hoặc lỗi
     */
    @PatchMapping("/{userId}")
    public ResponseEntity<String> updateCandidate(@PathVariable String userId, @RequestBody HashMap<String, Object> input) {
        try {
            Validator.isUserIdValid(userId);
            CandidatePatchRequest request = new CandidatePatchRequest();
            for (Map.Entry<String, Object> entry : input.entrySet()) {
                String key = entry.getKey();
                Object value = entry.getValue();

                if (key.equals(FULLNAME.value())) {
                    request.setFull_name(value);
                    continue;
                }
                if (key.equals(USERNAME.value())) {
                    request.setUsername(value);
                    continue;
                }
                if (key.equals(BIO.value())) {
                    request.setBio(value);
                    continue;
                }
                if (key.equals(AVATAR_URL.value())) {
                    request.setAvatarUrl(value);
                    continue;
                }
                if (key.equals(ADDRESS.value())) {
                    request.setAddress(value);
                    continue;
                }
                if (key.equals(PHONE.value())) {
                    request.setPhone(value);
                    continue;
                }
                if (key.equals(TWOFACTORENABLED.value())) {
                    assert value instanceof Boolean;
                    request.setTwoFactorEnabled(value);
                    continue;
                }
                throw new BusinessException("request không hợp lệ");
            }

/* DEBUGGING
            System.out.println("full_nameProvided: "
                    + request.full_nameProvided
                    + " | value: "
                    + request.getFullName());

            System.out.println("emailProvided: "
                    + request.emailProvided
                    + " | value: "
                    + request.getEmail());

            System.out.println("phoneProvided: "
                    + request.phoneProvided
                    + " | value: "
                    + request.getPhone());

            System.out.println("twoFactorEnabledProvided: "
                    + request.twoFactorEnabledProvided
                    + " | value: "
                    + request.getTwoFactorEnabled());
*/

            candidateService.edit(UUID.fromString(userId), request);
            return ResponseEntity.ok("Cập nhật thành công");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Cập nhật tài khoản thất bại do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }


    /**
     * Xóa tài khoản ứng viên theo userId.
     * <p>
     * Method này thực hiện xóa toàn bộ dữ liệu ứng viên khỏi hệ thống.
     *
     * @param userId ID của ứng viên cần xóa
     * @return Result với thông báo thành công hoặc lỗi
     */
    @DeleteMapping("/{userId}")
    public ResponseEntity<String> deleteCandidateUseId(@PathVariable String userId) {
        try {
            Validator.isUserIdValid(userId);
            candidateService.delete(UUID.fromString(userId));
            return ResponseEntity.ok("Xóa User thành công");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Xóa tài khoản thất bại do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }
}

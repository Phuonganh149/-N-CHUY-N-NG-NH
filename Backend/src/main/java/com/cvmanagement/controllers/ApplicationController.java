package com.cvmanagement.controllers;

import com.auth0.jwt.JWT;
import com.auth0.jwt.interfaces.DecodedJWT;
import com.cvmanagement.dto.request.ApplicationPatchRequest;
import com.cvmanagement.dto.request.ApplicationsPostRequest;
import com.cvmanagement.dto.response.ApplicationGetResponse;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.services.ApplicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Controller xử lý các yêu cầu liên quan đến đơn ứng tuyển.
 * <p>
 * Cung cấp các endpoint cho việc:
 * <ul>
 * <li>Lấy thông tin đơn ứng tuyển theo ID</li>
 * <li>Tạo đơn ứng tuyển mới</li>
 * <li>Cập nhật thông tin đơn ứng tuyển</li>
 * <li>Xóa đơn ứng tuyển</li>
 * </ul>
 * <p>
 *
 * @TODO Create @ControllerAdvice GlobalExceptionHandler for centralized error handling
 * @TODO Create response wrapper (APIResponse<T>) for consistent response format across all controllers
 */
@RestController
@RequestMapping("/application")
public class ApplicationController {
    private static final Logger log = LoggerFactory.getLogger(ApplicationController.class);
    private final ApplicationService applicationService;


    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    /**
     * Lấy thông tin chi tiết của một đơn ứng tuyển theo ID.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Kiểm tra ID đơn ứng tuyển hợp lệ</li>
     * <li>Truy vấn dữ liệu từ database</li>
     * <li>Mapping dữ liệu sang ApplicationGetResponse</li>
     * </ul>
     *
     * @param applicationId ID của đơn ứng tuyển cần lấy
     * @return Result chứa ApplicationGetResponse nếu thành công
     */
    @GetMapping("/id")
    public ResponseEntity<Object> getApplication(@RequestBody Integer applicationId) {
        try {
            return ResponseEntity.ok(new ApplicationGetResponse(applicationService.get(applicationId)));
        } catch (BusinessException e) {
            return new ResponseEntity<>("Lấy dữ liệu đơn không thành công do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Tạo đơn ứng tuyển mới từ người dùng.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Lấy userId từ cookie trong header</li>
     * <li>Xác minh người dùng hợp lệ</li>
     * <li>Gửi yêu cầu tạo đơn ứng tuyển tới service</li>
     * </ul>
     *
     * @param authorization Bearer token
     * @param request       chứa jobId và thông tin đơn ứng tuyển
     * @return Result với thông báo thành công hoặc lỗi
     */
    @PostMapping()
    public ResponseEntity<Object> newApplication(@RequestHeader("Authorization") String authorization, @RequestBody ApplicationsPostRequest request) {
        try {
            //Lấy userId
            if (authorization.isEmpty()) throw new BusinessException("thiếu cookie");
            DecodedJWT jwt = JWT.decode(authorization.substring(7));

            String sub = jwt.getSubject();

            UUID userId = UUID.fromString(sub);
            System.out.println(userId);
            //Gửi vào applicationService
            applicationService.create(request, userId);
            return ResponseEntity.ok("Thành công");

        } catch (BusinessException e) {
            return new ResponseEntity<>("Đăng ký thất bại do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Cập nhật thông tin đơn ứng tuyển.
     * <p>
     * Method này cho phép cập nhật các field: status, pipeline_stage, admin_note.
     *
     * @param request chứa các field cần cập nhật và cả id của application
     * @return Result với thông báo thành công hoặc lỗi
     */
    @PatchMapping("/{application_id}")
    public ResponseEntity<String> updateApplication(@PathVariable int application_id, @RequestBody ApplicationPatchRequest request) {
        try {
            if (request == null || application_id == 0) {
                throw new BusinessException("request không hợp lệ");
            }
            if (!request.isStatusProvided() && !request.isStageProvided() && !request.isAdminNoteProvided()) {
                throw new BusinessException("Không có trường cập nhật hợp lệ");
            }
            applicationService.update(application_id, request);
            return ResponseEntity.ok("Cập nhật thành công");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Cập nhật thất bại do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Xóa một đơn ứng tuyển theo ID.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Gửi yêu cầu xóa đơn ứng tuyển tới service</li>
     * <li>Xóa dữ liệu khỏi database</li>
     * </ul>
     *
     * @param application_id ID của đơn ứng tuyển cần xóa
     * @return Result với thông báo thành công hoặc lỗi
     */
    @DeleteMapping()
    public ResponseEntity<String> deleteApplication(@RequestBody int application_id) {
        try {
            applicationService.delete(application_id);
            return ResponseEntity.ok("Xóa đơn ứng tuyển thành công");
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi hệ thống", HttpStatusCode.valueOf(500));
        }
    }
}


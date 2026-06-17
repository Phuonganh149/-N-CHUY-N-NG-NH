package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.Job.JobPatchRequest;
import com.cvmanagement.dto.request.Job.JobPostRequest;
import com.cvmanagement.dto.response.Job.JobGetResponse;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.services.CoreEntityService.JobService;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các yêu cầu liên quan đến bài tuyển dụng (Job).
 * <p>
 * Cung cấp các endpoint cho việc:
 * <ul>
 * <li>Lấy thông tin bài tuyển dụng theo ID</li>
 * <li>Tạo bài tuyển dụng mới</li>
 * <li>Cập nhật thông tin bài tuyển dụng</li>
 * <li>Xóa bài tuyển dụng</li>
 * </ul>
 */
@RestController
@RequestMapping("/job")
public class JobController {
    private final JobService jobService;

    public JobController(JobService jobService) {
        this.jobService = jobService;
    }

    /**
     * Lấy thông tin chi tiết của một bài tuyển dụng theo ID.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Kiểm tra ID bài tuyển dụng hợp lệ</li>
     * <li>Truy vấn dữ liệu từ database</li>
     * <li>Mapping dữ liệu sang JobGetResponse</li>
     * </ul>
     *
     * @param jobId ID của bài tuyển dụng cần lấy
     * @return Result chứa JobGetResponse nếu thành công
     */
    @GetMapping("/{job_id}")
    public ResponseEntity<Object> getJob(@PathVariable int jobId) {
        try {
            return ResponseEntity.ok(new JobGetResponse(jobService.read(jobId)));
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể lấy công việc do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Tạo bài tuyển dụng mới.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Kiểm tra dữ liệu đầu vào không null</li>
     * <li>Gửi yêu cầu tạo tới service</li>
     * </ul>
     *
     * @param request chứa thông tin bài tuyển dụng mới
     * @return Result với thông báo thành công hoặc lỗi
     */
    @PostMapping
    public ResponseEntity<String> createJob(@RequestBody JobPostRequest request) {
        try {
            if (request.title() == null) throw new BusinessException("tiêu đề không được để trống");
            if (request.company() == null) throw new BusinessException("tên công ty không được để trống");
            if (request.deadline() == null) throw new BusinessException("ngày hết hạn không được để trống");
            jobService.create(request);
            return ResponseEntity.ok("Thành công");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể tạo công việc do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Cập nhật thông tin bài tuyển dụng.
     * <p>
     * Method này cho phép cập nhật: title, deadline.
     *
     * @param jobId   ID của bài tuyển dụng cần cập nhật
     * @param request chứa các field cần cập nhật
     * @return Result với thông báo thành công hoặc lỗi
     */
    @PatchMapping("/{jobId}")
    public ResponseEntity<Object> updateJob(@PathVariable int jobId, @RequestBody JobPatchRequest request) {
        try {
            if (request == null || (!request.isTitleProvided() && !request.isDeadlineProvided())) {
                throw new BusinessException("request không hợp lệ");
            }
            jobService.update(request, jobId);
            return ResponseEntity.ok("Thành công");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể cập nhật công việc do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Xóa bài tuyển dụng theo ID.
     * <p>
     * Method này thực hiện xóa bài tuyển dụng khỏi hệ thống.
     *
     * @param jobId ID của bài tuyển dụng cần xóa
     * @return Result với thông báo thành công hoặc lỗi
     */
    @DeleteMapping
    public ResponseEntity<Object> deleteJob(@RequestParam int jobId) {
        try {
            jobService.delete(jobId);
            return ResponseEntity.ok("Thành công");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể xóa công việc do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }
}

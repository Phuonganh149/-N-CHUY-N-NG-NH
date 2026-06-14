package com.cvmanagement.services;

import com.cvmanagement.dto.request.JobPatchRequest;
import com.cvmanagement.dto.request.JobPostRequest;
import com.cvmanagement.entities.Job;
import com.cvmanagement.enums.JobLocation;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.repositories.JobRepo;
import com.cvmanagement.utilities.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

import static com.cvmanagement.enums.DBSchema.Jobs.DEADLINE;
import static com.cvmanagement.enums.DBSchema.Jobs.TITLE;

/**
 * Service xử lý các nhân vụ liên quan đến bài tuyển dụng (Job).
 * <p>
 * Cung cấp các hàm cho việc:
 * <ul>
 * <li>Lấy thông tin bài tuyển dụng</li>
 * <li>Tạo bài tuyển dụng mới</li>
 * <li>Cập nhật bài tuyển dụng</li>
 * <li>Xóa bài tuyển dụng</li>
 * </ul>
 */
@Service
public class JobService {
    private final JobRepo jobRepo;
    private static final Logger log = LoggerFactory.getLogger(JobService.class);

    public JobService(JobRepo jobRepo) {
        this.jobRepo = jobRepo;
    }

    /**
     * Lấy thông tin bài tuyển dụng theo ID.
     *
     * @param jobId ID của bài tuyển dụng cần lấy
     * @return Job chứa thông tin bài tuyển dụng
     * @throws Exception khi xảy ra lỗi database
     */
    public Job get(int jobId) throws Exception {
        try {
            return jobRepo.read(jobId);
        } catch (BusinessException e) {
            log.error("Không thể hoàn thiện yêu cầu lấy công việc {} do {}", jobId, e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể xóa đơn ứng tuyển mã {} do {}. Source location: {}.{}.{}", jobId, e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }


    /**
     * Tạo bài tuyển dụng mới.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Xác thực dữ liệu đầu vào (tiêu đề, số lượng, công ty, lương, tags, deadline, vị trí)</li>
     * <li>Xử lý và format thông tin job</li>
     * <li>Lưu dữ liệu bài tuyển dụng vào database</li>
     * </ul>
     *
     * @param request chứa thông tin bài tuyển dụng mới
     * @throws Exception khi dữ liệu không hợp lệ hoặc database lỗi
     */
    public void add(JobPostRequest request) throws Exception {
        Job newJob = new Job();
        try {
            //Validate job title
            Validator.isJobTitleValid(request.title());
            newJob.setTitle(request.title());

            //Validate số người tuyền dụng
            if (request.quantity() < 2) throw new BusinessException("số lượng tuyển dụng quá ít");
            else newJob.setQuantity(request.quantity());

            //Validate tên công ty
            try {
                Validator.isCompanyNameValid(request.company());
                newJob.setCompany(request.company());
            } catch (Exception e) {
                throw new Exception(e.getMessage());
            }

            //Validate và xử lý salary
            try {
                if (request.salary().isEmpty()) newJob.setSalaryText("Thỏa thuận");
                else if (request.salary().contains("-")) {
                    String strippedSalaryText = request.salary().strip();
                    String[] temp = strippedSalaryText.split("-");
                    newJob.setSalaryMin(BigDecimal.valueOf(Double.parseDouble(temp[0])));
                    newJob.setSalaryMax(BigDecimal.valueOf(Double.parseDouble(temp[1])));
                } else {
                    newJob.setSalaryMin(BigDecimal.valueOf(Double.parseDouble(request.salary().strip())));
                }
            } catch (NumberFormatException e) {
                throw new BusinessException("lương không hợp lệ");
            }

            //Validate và xử lý tags (skills)
            if (request.tags().isEmpty()) newJob.setTags(new ArrayList<>(List.of("Other")));
            else if (!request.tags().matches("^[A-Za-z,]+$")) {
                throw new BusinessException("skill không hợp lệ");
            } else
                newJob.setTags(Arrays.stream(request.tags().strip().split(",")).collect(Collectors.toCollection(ArrayList::new)));

            //Validate và xử lý deadline
            if (!request.deadline().minusDays(2).isAfter(LocalDate.now())
            ) throw new BusinessException("deadline quá sớm, tối thiểu hai ngày trở đi");
            else newJob.setDeadline(Instant.from(request.deadline()));

            //Validate Location
            boolean found = false;
            for (JobLocation elem : JobLocation.values()) {
                if (request.location().equalsIgnoreCase(elem.value())) {
                    newJob.setLocation(elem);
                    found = true;
                    break;
                }
            }
            if (!found) {
                throw new BusinessException("vị trí tuyển dụng không khả dụng");
            }

            //Thêm vào CSDL
            jobRepo.create(newJob);

        } catch (BusinessException e) {
            log.error("Không thể tạo bài dăng tên {} do {}", request.title(), e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể tạo bài dăng tên {} do {}. Source location: {}.{}.{}", request.title(), e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }

    /**
     * Cập nhật thông tin bài tuyển dụng.
     * <p>
     * Method này cho phép cập nhật: title, deadline.
     *
     * @param jobId   ID của bài tuyển dụng cần cập nhật
     * @param request chứa các field cần cập nhật
     * @throws Exception khi xảy ra lỗi database
     */
    public void update(int jobId, JobPatchRequest request) throws Exception {
        try {
            Job oldVal = jobRepo.read(jobId);
            Set<String> modifyField = new HashSet<>();
            if (request.isDeadlineProvided()) {
                oldVal.setDeadline(request.getDeadline());
                modifyField.add(DEADLINE.value());
            }
            if (request.isTitleProvided()) {
                oldVal.setTitle(request.getTitle());
                modifyField.add(TITLE.value());
            }
            jobRepo.update(jobId, oldVal, modifyField);
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể cập nhật bài đăng {} do {}. Source location: {}.{}.{}", jobId, e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }

    /**
     * Xóa bài tuyển dụng theo ID.
     *
     * @param Id ID của bài tuyển dụng cần xóa
     * @throws Exception khi xảy ra lỗi database
     */
    public void delete(int Id) throws Exception {
        try {
            jobRepo.delete(Id);
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể xóa bài đăng {} do {}. Source location: {}.{}.{}", Id, e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }
}

package com.cvmanagement.services;

import com.cvmanagement.dto.request.ApplicationPatchRequest;
import com.cvmanagement.dto.request.ApplicationsPostRequest;
import com.cvmanagement.entities.CV;
import com.cvmanagement.entities.applications;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.repositories.AccountRepo;
import com.cvmanagement.repositories.ApplicationsRepo;
import com.cvmanagement.repositories.CvRepo;
import com.cvmanagement.repositories.JobRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static com.cvmanagement.enums.DBSchema.Applications.*;

/**
 * Service xử lý các nhân vụ liên quan đến đơn ứng tuyển.
 * <p>
 * Cung cấp các hàm cho việc:
 * <ul>
 * <li>Lấy thông tin đơn ứng tuyển</li>
 * <li>Tạo đơn ứng tuyển mới</li>
 * <li>Cập nhật đơn ứng tuyển</li>
 * <li>Xóa đơn ứng tuyển</li>
 * </ul>
 */
@Service
public class ApplicationService {
    private final ApplicationsRepo applicationsRepo;
    private final AccountRepo accountRepo;
    private final CvRepo cvRepo;
    private final JobRepo jobRepo;
    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    public ApplicationService(ApplicationsRepo applicationsRepo, AccountRepo accountRepo, CvRepo cvRepo, JobRepo jobRepo) {
        this.applicationsRepo = applicationsRepo;
        this.accountRepo = accountRepo;
        this.cvRepo = cvRepo;
        this.jobRepo = jobRepo;
    }

    /**
     * Lấy thông tin đơn ứng tuyển theo ID.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Truy vấn dữ liệu từ repository</li>
     * <li>Mapping dữ liệu sang entity applications</li>
     * </ul>
     *
     * @param applicationId ID của đơn ứng tuyển cần lấy
     * @return applications chứa thông tin đơn ứng tuyển
     * @throws Exception khi xảy ra lỗi truy vấn database
     */
    public applications get(int applicationId) throws Exception {
        try {
            return applicationsRepo.read(applicationId);
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể lấy đơn ứng tuyển id {} do {}. Source locatdoion: {}.{}.{}", applicationId, e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }

    /**
     * Tạo đơn ứng tuyển mới.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Lấy CV chính của người dùng</li>
     * <li>Tạo đơn ứng tuyển mới vào database</li>
     * <li>Tăng số lượng ứng tuyển của job</li>
     * </ul>
     *
     * @param request chứa jobId và email người dùng
     * @param userId  ID của người dùng đang ứng tuyển
     * @throws Exception khi xảy ra lỗi xác minh hoặc database
     */
    public void create(ApplicationsPostRequest request, UUID userId) throws Exception {
        try {
            //Lấy primary CV của người dùng
            CV CandidateCV = cvRepo.getPrimary(userId);

            //Thêm job mới vào repository
            applicationsRepo.create(new applications(
                    userId,
                    request.jobId(),
                    CandidateCV.getCvId()
            ));

            //Tăng quantity ứng tuyển cho jobID
            jobRepo.IncreseQuantity(request.jobId());
        } catch (BusinessException e) {
            log.error("Yêu cầu tạo đơn ứng tuyển cho người dùng {} không thành công do {}", userId, e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Yêu cầu tạo đơn ứng tuyển cho người dùng {} không thành công do {}. Source location: {}.{}.{}", request.email(), e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }

    /**
     * Cập nhật thông tin đơn ứng tuyển.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Lấy dữ liệu hiện tại của đơn</li>
     * <li>Cập nhật các field: status, stage, adminNote</li>
     * <li>Lưu dữ liệu mới vào database</li>
     * </ul>
     *
     * @param applicationID ID của đơn ứng tuyển cần cập nhật
     * @param request       chứa các field cần cập nhật
     * @throws Exception khi xảy ra lỗi database hoặc dữ liệu không hợp lệ
     */
    public void update(int applicationID, ApplicationPatchRequest request) throws Exception {
        try {
            Set<String> modifyField = new HashSet<>();
            applications oldVal = applicationsRepo.read(applicationID);

            if (request.isStatusProvided()) {
                oldVal.setStatus(request.getStatus());
                modifyField.add(STATUS.value());
            }
            if (request.isStageProvided()) {
                oldVal.setStage(request.getStage());
                modifyField.add((PIPELINE_STAGE.value()));
            }
            if (request.isAdminNoteProvided()) {
                oldVal.setAdminNote(request.getAdminNote());
                modifyField.add((ADMIN_NOTE.value()));
            }

            applicationsRepo.update(applicationID, oldVal, modifyField);
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể cập nhật đơn ứng tuyển id {} do {}. Source location: {}.{}.{}", applicationID, e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }

    /**
     * Xóa đơn ứng tuyển theo ID.
     *
     * <p>Thực hiện kiểm tra sự tồn tại của đơn ứng tuyển trước khi xóa.
     * Nếu đơn ứng tuyển không tồn tại, phương thức sẽ ném ra
     * {@link BusinessException}.</p>
     *
     * @param applicationId ID của đơn ứng tuyển cần xóa
     * @throws BusinessException nếu đơn ứng tuyển không tồn tại
     * @throws Exception         nếu xảy ra lỗi trong quá trình truy cập hoặc thao tác dữ liệu
     */
    public void delete(int applicationId) throws Exception {
        try {
            if (!applicationsRepo.isExits(applicationId))
                throw new BusinessException("đơn ứng tuyển không tồn tại");
            applicationsRepo.delete(applicationId);
        } catch (BusinessException e) {
            log.error("Xóa đơn ứng tuyển {} không thành công do {}", applicationId, e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể xóa đơn ứng tuyển mã {} do {}. Source location: {}.{}.{}", applicationId, e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }
}

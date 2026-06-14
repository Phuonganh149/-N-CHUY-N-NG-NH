package com.cvmanagement.services;

import com.cvmanagement.dto.SignupAccount;
import com.cvmanagement.dto.request.CandidatePatchRequest;
import com.cvmanagement.entities.Candidate;
import com.cvmanagement.enums.AccountRole;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.repositories.AccountRepo;
import com.cvmanagement.repositories.CandidateRepo;
import com.cvmanagement.utilities.DisplayIDGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import static com.cvmanagement.enums.DBSchema.User.*;

@Service
public class CandidateService {
    private final AccountRepo accountRepo;
    private final CandidateRepo candidateRepo;
    private static final Logger log = LoggerFactory.getLogger(CandidateService.class);

    public CandidateService(AccountRepo accountRepo, CandidateRepo candidateRepo) {
        this.accountRepo = accountRepo;
        this.candidateRepo = candidateRepo;
    }

    /**
     * Tạo mới tài khoản ứng viên.
     * Method này thực hiện:
     * <li>Tạo displayId cho ứng viên</li>
     * <li>Tạo object Candidate từ dữ liệu SignupAccount</li>
     * <li>Lưu dữ liệu ứng viên vào database</li>
     *
     * @param signupAccount chứa thông tin tài khoản sau khi xác minh và đăng ký thành công ở AuthService
     * @throws Exception khi xảy ra lỗi tạo tài khoản trong databaseAuthService
     */
    public void add(SignupAccount signupAccount) throws Exception {
        //Thêm vào CSDL
        String newDisplayID = DisplayIDGenerator.generateID(AccountRole.Candidate);
        Candidate currCandidate = new Candidate(signupAccount.userId(), newDisplayID, signupAccount.fullname(), signupAccount.email(), signupAccount.createdAt(), signupAccount.updatedAt());

        try {
            candidateRepo.create(currCandidate);
        } catch (SQLException e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("lỗi khi tạo tài khoản {} do {}. Source location: {}.{}.{}}", signupAccount.email(), e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e.getMessage());
        }
    }

    /**
     * Lấy thông tin ứng viên dựa trên userId.
     * Method này thực hiện:
     * <li>Truy vấn dữ liệu ứng viên từ database</li>
     * <li>Mapping dữ liệu sang CandidateGetResponse</li>
     *
     * @param userId id của ứng viên cần truy vấn
     * @return Candidate chứa toàn bộ thông tin ứng viên
     * @throws Exception khi xảy ra lỗi truy vấn dữ liệu
     */
    public Candidate get(UUID userId) throws Exception {
        try {
            return candidateRepo.read(userId);
        } catch (BusinessException e) {
            log.error("Yêu cầu lấy thông tin tài khoản {} không thành công do {}", userId, e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Yêu cầu lấy thông tin tài khoản {} không thành công do {}. Source location: {}.{}.{}", userId, e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }

    /**
     * Cập nhật thông tin ứng viên dựa trên userId.
     * Method này thực hiện:
     * <li>Lấy dữ liệu hiện tại của ứng viên</li>
     * <li>Kiểm tra các field được gửi lên trong request</li>
     * <li>Cập nhật dữ liệu tương ứng vào object Candidate</li>
     * <li>Lưu dữ liệu mới vào database</li>
     *
     * @param userId  id của ứng viên cần cập nhật
     * @param request chứa các field cần cập nhật
     * @throws BusinessException khi dữ liệu đầu vào không hợp lệ
     * @throws Exception         khi xảy ra lỗi cập nhật dữ liệu
     */
    public void edit(UUID userId, CandidatePatchRequest request) throws Exception {
        Set<String> fields = new HashSet<>();
        try {
            Candidate oldVal = candidateRepo.read(userId);

            if (request.full_nameProvided) {
                oldVal.setFullName(request.getFull_name());
                fields.add(FULLNAME.value());
            }
            if (request.usernameProvided) {
                oldVal.setUsername(request.getUsername());
                fields.add(USERNAME.value());
            }
            if (request.bioProvided) {
                oldVal.setBio(request.getBio());
                fields.add(BIO.value());
            }
            if (request.avatarUrlProvided) {
                oldVal.setAvatarUrl(request.getAvatarUrl());
                fields.add(AVATAR_URL.value());
            }
            if (request.addressProvided) {
                oldVal.setAddress(request.getAddress());
                fields.add((ADDRESS.value()));
            }
            if (request.phoneProvided) {
                oldVal.setPhone(request.getPhone());
                fields.add(PHONE.value());
            }
            if (request.twoFactorEnabledProvided) {
                if (request.getTwoFactorEnabled() == null) throw new BusinessException("2FA không thể có giá trị NULL");
                oldVal.setTwoFactorEnabled(request.getTwoFactorEnabled());
                fields.add(TWOFACTORENABLED.value());
            }

            // Yêu cầu DB cập nhật thông tin với fields được cấp
            candidateRepo.update(userId, oldVal, fields);
        } catch (BusinessException e) {
            log.error("Yêu cầu cập nhật tài khoản {} không thành công do {}", userId, e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (SQLException e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể update tài khoản ứng viên userId {} do {}. Source location: {}.{}.{}", userId, e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }

    /**
     * Xóa tài khoản ứng viên dựa trên userId.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Gửi yêu cầu xóa dữ liệu ứng viên tới repository</li>
     * <li>Xóa thông tin ứng viên khỏi database</li>
     * </ul>
     *
     * @param userId id của ứng viên cần xóa
     * @throws Exception khi xảy ra lỗi trong quá trình xóa dữ liệu
     */
    public void delete(UUID userId) throws Exception {
        try {
            candidateRepo.delete(userId);
        } catch (SQLException e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể xóa tài khoản {} do {}. Source location: {}.{}.{}", userId, e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e.getMessage());
        }
    }

    /**
     * Upload CV file cho ứng viên.
     * <p>
     *
     * @throws Exception khi xảy ra lỗi upload hoặc validation
     * @ TODO Check file type (PDF, DOC, DOCX)
     * @ TODO Validate file size (max 5MB)
     * @ TODO Upload file to Supabase Storage
     * @ TODO Update CV entity with file URL
     * @ TODO Persist changes to database
     */
    public void uploadCv() {
        // TODO: Implement CV file upload workflow with validation
    }
}

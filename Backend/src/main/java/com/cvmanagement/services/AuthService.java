package com.cvmanagement.services;

import com.cvmanagement.dto.SignupAccount;
import com.cvmanagement.dto.SupabaseLoginResponse;
import com.cvmanagement.dto.SupabaseSignupResponse;
import com.cvmanagement.dto.request.CandidateSignupRequest;
import com.cvmanagement.dto.request.LoginRequest;
import com.cvmanagement.dto.response.LoginResponse;
import com.cvmanagement.entities.Account;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.repositories.AccountRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final CandidateService candidateService;
    private final AccountRepo accountRepo;
    private final SupabaseService supabaseService;

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);


    public AuthService(AccountRepo accountRepo, CandidateService candidateService, SupabaseService supabaseService) {
        this.accountRepo = accountRepo;
        this.candidateService = candidateService;
        this.supabaseService = supabaseService;
    }

    /**
     * Xử lý đăng nhập tài khoản người dùng.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Kiểm tra tài khoản có tồn tại trong hệ thống hay không</li>
     * <li>Gửi yêu cầu đăng nhập tới Supabase Authentication</li>
     * <li>Lấy thông tin tài khoản từ database nội bộ</li>
     * <li>Trả về access token cùng thông tin tài khoản</li>
     * </ul>
     *
     * @param request chứa email và password dùng để đăng nhập
     * @return LoginResponse chứa access token và thông tin tài khoản hiện tại
     * @throws BusinessException khi tài khoản không tồn tại
     * @throws Exception         khi xảy ra lỗi database hoặc lỗi hệ thống
     */
    public LoginResponse login(LoginRequest request) throws Exception {
        try {
            // Check tài khoản tồn tại
            if (!accountRepo.isExits(request.getEmail())) throw new BusinessException("tài khoản không tồn tại");


            // Lấy dữ liệu người dùng từ Supabase
            SupabaseLoginResponse supabaseResposne;
            supabaseResposne = supabaseService.logIn(request.getEmail(), request.getPassword());

            // Lấy dữ liệu người dùng từ db
            Account currLoginAccount = accountRepo.get(supabaseResposne.getUser().getId());

            // Trả về response (bao gồm token, thông tin cơ bản user có trong bảng users)
            return new LoginResponse(supabaseResposne.getAccess_token(), currLoginAccount);

        } catch (BusinessException e) {
            log.error("Yêu cầu đăng nhập tài khoản {} không thành công do {}", request.getEmail(), e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Yêu cầu đăng nhập tài khoản {} không thành công do {}. Source location: {}.{}.{}", request.getEmail(), e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }


    /**
     * Xử lý đăng ký tài khoản ứng viên mới.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Kiểm tra email đã được đăng ký trước đó hay chưa</li>
     * <li>Tạo tài khoản trên Supabase Authentication</li>
     * <li>Tạo object SignupAccount từ dữ liệu Supabase trả về</li>
     * <li>Gửi dữ liệu sang candidateService để lưu vào database</li>
     * </ul>
     *
     * @param request chứa thông tin đăng ký của ứng viên
     * @throws BusinessException khi email đã tồn tại trong hệ thống
     * @throws Exception         khi xảy ra lỗi hệ thống hoặc lỗi từ Supabase
     */
    public void signupCandidate(CandidateSignupRequest request) throws Exception {
        //Check trùng lặp dữ liệu
        if (accountRepo.isExits(request.email())) throw new BusinessException("Email đã được đăng ký từ trước");

        try {
            //Tạo user trong supabase auth
            SupabaseSignupResponse data = supabaseService.signUp(request.email(), request.password());
            SignupAccount curr = new SignupAccount(
                    data.getUser().getId(),
                    data.getUser().getProvider(),
                    request.fullname(),
                    data.getUser().getEmail(),
                    data.getUser().getCreatedAt(),
                    data.getUser().getUpdatedAt()
            );

            // Yêu cầu service dành riêng cho ứng viên thêm vào Repo
            candidateService.add(curr);

        } catch (BusinessException e) {
            log.error("Yêu cầu đăng ký tài khoản {} không thành công do {}", request.email(), e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (Exception e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Yêu cầu đăng ký tài khoản {} không thành công do {}. Source location: {}.{}.{}", request.email(), e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }
}

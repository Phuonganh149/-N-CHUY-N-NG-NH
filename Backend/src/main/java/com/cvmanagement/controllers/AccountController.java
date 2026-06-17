package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.Candidate.CandidateSignupRequest;
import com.cvmanagement.dto.request.LoginRequest;
import com.cvmanagement.dto.response.LoginResponse;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.services.AuthService;
import com.cvmanagement.utilities.Validator;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AccountController {
    private final AuthService authService;

    public AccountController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Xử lý yêu cầu đăng nhập của người dùng.
     * <p>API này thực hiện:
     * <ul>
     * <li>Kiểm tra email và password không được để trống</li>
     * <li>Kiểm tra định dạng email và password hợp lệ</li>
     * <li>Gửi yêu cầu đăng nhập tới authService</li>
     * <li>Trả về access token trong header Authorization</li>
     * <li>Trả về thông tin cơ bản của người dùng trong response body</li>
     * </ul>
     *
     * @param request chứa thông tin đăng nhập gồm email và password
     * @return ResponseEntity chứa:
     * <ul>
     * <li>HTTP 200 nếu đăng nhập thành công</li>
     * <li>HTTP 400 nếu dữ liệu đầu vào không hợp lệ</li>
     * <li>HTTP 500 nếu xảy ra lỗi hệ thống</li>
     * @throws BusinessException khi email hoặc password không hợp lệ
     */
    @PostMapping("/login")
    public ResponseEntity<Object> login(@RequestBody LoginRequest request) {
        try {
            // Validate field input không null
            if (request.getEmail() == null) throw new BusinessException("Email không được để trống");
            if (request.getPassword() == null) throw new BusinessException("Password không được để trống");

            // Validate đầu vào đúng với rule trong validator
            Validator.isEmailValid(request.getEmail());
            Validator.isPasswordValid(request.getPassword());

            // Gửi yêu cầu đăng nhập vào authService và lấy về response
            LoginResponse response = authService.login(request);

            // Trả về response cùng với header chứa token của người dùng và body chứa thông tin cơ bản của người dùng
            return ResponseEntity.ok().header(HttpHeaders.AUTHORIZATION, response.getToken()).body(response);
        } catch (BusinessException e) {
            return new ResponseEntity<>("Đăng nhập thất bại do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    /**
     * Xử lý yêu cầu đăng ký tài khoản ứng viên.
     *
     * <p>API này thực hiện:
     * <ul>
     * <li>Kiểm tra fullname, email và password không được để trống</li>
     * <li>Kiểm tra định dạng email và password hợp lệ</li>
     * <li>Gửi thông tin đăng ký tới authService để tạo tài khoản ứng viên</li>
     * <li>Trả về trạng thái thành công nếu tạo tài khoản hoàn tất</li>
     * </ul>
     *
     * @param request chứa thông tin đăng ký của ứng viên gồm fullname, email và password
     * @return ResponseEntity chứa:
     * <ul>
     * <li>HTTP 200 nếu đăng ký thành công</li>
     * <li>HTTP 400 nếu dữ liệu đầu vào không hợp lệ</li>
     * <li>HTTP 500 nếu xảy ra lỗi hệ thống khi tạo tài khoản</li>
     * </ul>
     * @throws BusinessException khi dữ liệu đầu vào không hợp lệ
     */
    @PostMapping("/signup/candidate")
    public ResponseEntity<String> signup(@RequestBody CandidateSignupRequest request) {
        try {
            // Validate field input không null
            if (request.fullname() == null) throw new BusinessException("Tên không được để trống");
            if (request.email() == null) throw new BusinessException("Email không được để trống");
            if (request.password() == null) throw new BusinessException("Mật khẩu không được để trống");

            // Validate cơ bản theo validator
            Validator.isEmailValid(request.email());
            Validator.isPasswordValid(request.password());

            // Gửi vào service request
            authService.signupCandidate(request);

            // Nếu không có lỗi trả về response 200
            return new ResponseEntity<>("ok", HttpStatusCode.valueOf(200));

        } catch (BusinessException e) {
            return new ResponseEntity<>("Đăng ký thất bại do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

/*
    @PostMapping("/signup/HR")
    public Result<Object> signup(@RequestBody CandidateSignupRequest request) {
        if (request.fullname() == null) return Result.error("Tên không được để trống");
        if (request.email() == null) return Result.error("Email không được để trống");
        if (request.password() == null) return Result.error("Mật khẩu không được để trống");
        try {
            Validator.isEmailValid(request.email());
            Validator.isPasswordValid(request.password());
            authService.signupCandidate(request);
            return Result.ok("Thành công");
        } catch (Exception e) {
            return Result.error("Không thể tạo tài khoản do " + e.getMessage());
        }
    }
*/
}

package com.cvmanagement.services;

import com.cvmanagement.dto.SupabaseLoginResponse;
import com.cvmanagement.dto.SupabaseSignupResponse;
import com.cvmanagement.exceptions.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class SupabaseService {
    @Value("${supabase.url}")
    private String url;
    @Value("${supabase.anon.api}")
    private String api;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Gửi yêu cầu đăng ký tài khoản tới Supabase Authentication.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Tạo request header chứa apikey của Supabase</li>
     * <li>Tạo request body chứa email và password</li>
     * <li>Gửi HTTP request tới endpoint signup của Supabase</li>
     * <li>Nhận và trả về dữ liệu tài khoản vừa được tạo</li>
     * </ul>
     *
     * @param email    email dùng để đăng ký tài khoản
     * @param password password dùng để đăng ký tài khoản
     * @return SupabaseSignupResponse chứa dữ liệu người dùng từ Supabase
     * @throws BusinessException khi password không hợp lệ
     * @throws Exception         khi Supabase gặp lỗi hoặc xảy ra lỗi hệ thống
     */
    public SupabaseSignupResponse signUp(String email, String password) throws Exception {
        // Tạo header cho request và thêm content-type cùng apikey của Supabase
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", api);

        // Tạo body chứa thông tin email và password người dùng
        Map<String, String> body = new HashMap<>();
        body.put("email", email);
        body.put("password", password);

        // Gắn body và header vào HttpEntity để gửi request
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        // Khai báo biến chứa response trả về từ Supabase
        ResponseEntity<SupabaseSignupResponse> response;
        try {
            // Gửi HTTP POST request tới endpoint signup của Supabase
            response = restTemplate.postForEntity(url + "/auth/v1/signup", request, SupabaseSignupResponse.class);
            return response.getBody();
        } catch (HttpClientErrorException e) {
            // Nếu status code là 400 => dữ liệu đầu vào không hợp lệ
            if (e.getStatusCode().value() == 400)
                throw new BusinessException("password sai");

            // Nếu Supabase gặp lỗi server hoặc request thất bại
            if (e.getStatusCode().is5xxServerError() || e.getStatusCode().isError())
                throw new Exception("supasebase lỗi");
        }
        // Trường hợp lỗi không xác định
        throw new Exception("lỗi không xác định");
    }

    /**
     * Gửi yêu cầu đăng nhập tới Supabase Authentication.
     * <p>
     * Method này thực hiện:
     * <ul>
     * <li>Tạo request header chứa apikey của Supabase</li>
     * <li>Tạo request body chứa email và password</li>
     * <li>Gửi HTTP request tới endpoint login của Supabase</li>
     * <li>Nhận access token và thông tin người dùng từ Supabase</li>
     *
     * </ul>
     *
     * @param email    email dùng để đăng nhập
     * @param password password dùng để đăng nhập
     * @return SupabaseLoginResponse chứa access token và dữ liệu người dùng
     * @throws BusinessException khi email hoặc password không chính xác
     * @throws Exception         khi Supabase gặp lỗi hoặc xảy ra lỗi hệ thống
     */
    public SupabaseLoginResponse logIn(String email, String password) throws Exception {
        // Tạo header cho request và thêm content-type cùng apikey của Supabase 
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("apikey", api);

        // Tạo body chứa email và password người dùng 
        Map<String, String> body = new HashMap<>();
        body.put("email", email);
        body.put("password", password);

        // Gắn body và header vào HttpEntity để gửi request 
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        // Khai báo biến chứa response trả về từ Supabase 
        ResponseEntity<SupabaseLoginResponse> response;
        try {
            // Gửi HTTP POST request tới endpoint login của Supabase 
            response = restTemplate.postForEntity(url + "/auth/v1/token?grant_type=password", request, SupabaseLoginResponse.class);

            // Trả về access token và thông tin người dùng từ Supabase 
            return response.getBody();
        } catch (HttpClientErrorException e) {
            // Nếu status code là 400 -> email hoặc password không chính xác
            if (e.getStatusCode().value() == 400)
                throw new BusinessException("password sai");

            // Nếu status code là 429 -> rate limit
            if (e.getStatusCode().value() == 429)
                throw new BusinessException("chạm tới giới hạn yêu cầu");

            // Nếu Supabase gặp lỗi server hoặc request thất bại
            if (e.getStatusCode().is5xxServerError() || e.getStatusCode().isError())
                throw new Exception("supasebase lỗi");
        }
        throw new Exception("lỗi không xác định");
    }
}

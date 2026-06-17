package com.cvmanagement.controllers;

import com.cvmanagement.dto.request.Company.CompanyPatchRequest;
import com.cvmanagement.dto.request.Company.CompanyPostRequest;
import com.cvmanagement.dto.response.Company.CompanyGetResponse;
import com.cvmanagement.enums.CompanyLocation;
import com.cvmanagement.enums.CompanyStatus;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.services.CoreEntityService.CompanyService;
import com.cvmanagement.utilities.Validator;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

import static com.cvmanagement.enums.DBSchema.Companies.*;

@RestController
@RequestMapping("/company")
public class CompanyController {
    private final CompanyService companyService;

    public CompanyController(CompanyService companyService) {
        this.companyService = companyService;
    }

    @PostMapping
    public ResponseEntity<String> createCompany(@RequestBody CompanyPostRequest request) {
        try {
            //Xác minh tên công ty
            if (request.getName() == null) throw new BusinessException("tên công ty không được để trống");
            Validator.isCompanyNameValid(request.getName());

            //Xác minh plan
            if (request.getPlan() == null || request.getPlan().isEmpty())
                throw new BusinessException("công ty phải đăng ký một gói");

            //Xác minh location
            boolean found = false;
            for (CompanyLocation location : CompanyLocation.values()) {
                if (request.getLocation().equalsIgnoreCase(location.value()) || request.getLocation().equalsIgnoreCase(location.name())) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                throw new BusinessException("Vị trí không hợp lệ");
            }

            //Xác minh industry
            if (request.getIndustry() != null) {
                Validator.isIndustryValid(request.getIndustry());
            }

            companyService.create(request);

            return ResponseEntity.ok("Thành công");
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể tạo công ty do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    @GetMapping("/{company_id}")
    public ResponseEntity<Object> getCompany(@PathVariable int company_id) {
        try {
            return ResponseEntity.ok(new CompanyGetResponse(companyService.read(company_id)));
        } catch (BusinessException e) {
            return new ResponseEntity<>("Không thể lấy thông tin công ty do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    @PatchMapping("/{company_id}")
    public ResponseEntity<String> updateCompany(@PathVariable int company_id, @RequestBody HashMap<String, Object> input) {
        try {
            CompanyPatchRequest request = new CompanyPatchRequest();
            for (Map.Entry<String, Object> entry : input.entrySet()) {
                String key = entry.getKey();
                Object value = entry.getValue();

                if (key.equals(NAME.value())) {
                    if (value != null && !value.toString().isEmpty()) request.setName((String) value);
                    else throw new BusinessException("tên công ty không được trống");
                    continue;
                }
                if (key.equals(INDUSTRY.value())) {
                    if (!value.toString().isEmpty()) request.setIndustry(value);
                    continue;
                }
                if (key.equals(LOCATION.value())) {
                    if (!value.toString().isEmpty()) request.setLocation(value);
                    continue;
                }
                if (key.equals(PLAN.value())) {
                    if (value != null && !value.toString().isEmpty()) request.setPlan((String) value);
                    else throw new BusinessException("gói đăng ký không được trống");
                    continue;
                }
                if (key.equals(STATUS.value())) {
                    if (value != null && !value.toString().isEmpty()) {
                        for (CompanyStatus companyStatus : CompanyStatus.values()) {
                            if (companyStatus.toString().equals(value.toString()))
                                request.setStatus((CompanyStatus) value);
                        }
                    } else throw new BusinessException("trạng thái không được trống");
                    continue;
                }
                throw new BusinessException("request không hợp lệ");
            }

            companyService.update(request, company_id);
            return ResponseEntity.ok("Thành công");
        } catch (
                BusinessException e) {
            return new ResponseEntity<>("Không thể cập nhật công ty do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }

    @DeleteMapping
    public ResponseEntity<String> deleteCompany(@PathVariable int id) {
        try {
            companyService.delete(id);
            return ResponseEntity.ok("Thành công");
        } catch (
                BusinessException e) {
            return new ResponseEntity<>("Không thể xóa công ty do " + e.getMessage(), HttpStatusCode.valueOf(400));
        } catch (Exception e) {
            return new ResponseEntity<>("Lỗi server", HttpStatusCode.valueOf(500));
        }
    }
}

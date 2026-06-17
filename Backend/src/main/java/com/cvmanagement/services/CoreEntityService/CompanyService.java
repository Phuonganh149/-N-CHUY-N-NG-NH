package com.cvmanagement.services.CoreEntityService;

import com.cvmanagement.dto.request.Company.CompanyPatchRequest;
import com.cvmanagement.dto.request.Company.CompanyPostRequest;
import com.cvmanagement.entities.Company;
import com.cvmanagement.enums.CompanyLocation;
import com.cvmanagement.exceptions.BusinessException;
import com.cvmanagement.repositories.CompanyRepo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;

import static com.cvmanagement.enums.DBSchema.Companies.*;

@Service
public class CompanyService implements CoreEntityServiceInterface<Company, Integer, CompanyPostRequest, CompanyPatchRequest> {
    private final CompanyRepo companyRepo;
    private final SubscriptionService subscriptionService;
    private static final Logger log = LoggerFactory.getLogger(CompanyService.class);

    public CompanyService(CompanyRepo companyRepo, SubscriptionService subscriptionService) {
        this.companyRepo = companyRepo;
        this.subscriptionService = subscriptionService;
    }

    @Override
    public void create(CompanyPostRequest request) throws Exception {
        try {
            //Xác minh plan
            subscriptionService.read(request.getPlan());

            //Tạo object mới để tiếp tục flow hoặc import vào DB
            Company newCompany = new Company(
                    request.getName(),
                    request.getIndustry(),
                    CompanyLocation.valueOf(request.getLocation()),
                    request.getPlan());

            companyRepo.create(newCompany);
        } catch (BusinessException e) {
            log.error("Yêu cầu tạo công ty {} không thành công do {}", request.getName(), e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (SQLException e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Yêu cầu tạo công ty {} do {}. Source location: {}.{}.{}", request.getName(), e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }

    @Override
    public Company read(Integer id) throws Exception {
        return companyRepo.read(id);
    }

    @Override
    public void update(CompanyPatchRequest request, Integer updateObjectId) throws Exception {
        Set<String> fields = new HashSet<>();
        try {
            Company oldVal = companyRepo.read(updateObjectId);
            if (request.nameProvided()) {
                oldVal.setName(request.getName());
                fields.add(NAME.value());
            }
            if (request.industryProvided()) {
                oldVal.setIndustry(request.getIndustry());
                fields.add(INDUSTRY.value());
            }
            if (request.locationProvided()) {
                oldVal.setLocation(request.getLocation());
                fields.add(LOCATION.value());
            }
            if (request.planProvided()) {
                oldVal.setPlan(request.getPlan());
                fields.add(PLAN.value());
            }
            if (request.statusProvided()) {
                oldVal.setStatus(request.getStatus());
                fields.add(STATUS.value());
            }

            // Yêu cầu DB cập nhật thông tin với fields được cấp
            companyRepo.update(updateObjectId, oldVal, fields);
        } catch (BusinessException e) {
            log.error("Yêu cầu cập nhật công ty {} không thành công do {}", updateObjectId, e.getMessage());
            throw new BusinessException(e.getMessage());
        } catch (SQLException e) {
            StackTraceElement origin = e.getStackTrace()[0];
            log.error("Không thể update thông tin công ty {} do {}. Source location: {}.{}.{}", request.getName(), e.getMessage(), origin.getClassName(), origin.getMethodName(), origin.getLineNumber());
            throw new Exception(e);
        }
    }

    @Override
    public void delete(Integer id) throws Exception {
        companyRepo.delete(id);
    }
}

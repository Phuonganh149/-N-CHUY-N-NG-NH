package com.cvmanagement.mappers;

import com.cvmanagement.entities.Company;
import com.cvmanagement.enums.CompanyLocation;
import com.cvmanagement.enums.CompanyStatus;

import java.sql.ResultSet;
import java.sql.SQLException;

import static com.cvmanagement.enums.DBSchema.Companies.*;

public class mapCompany {
    public static Company map(ResultSet rs) throws SQLException {
        return new Company(
                rs.getInt(COMPANY_ID.value()),
                rs.getString(NAME.value()),
                rs.getString(SLUG.value()),
                rs.getString(INDUSTRY.value()),
                CompanyLocation.valueOf(rs.getString(LOCATION.value())),
                rs.getString(PLAN.value()),
                CompanyStatus.valueOf(rs.getString(STATUS.value())),
                rs.getTimestamp(CREATED_AT.value()).toInstant(),
                rs.getTimestamp(UPDATED_AT.value()).toInstant(),
                rs.getTimestamp(VERIFIED_AT.value()).toInstant(),
                rs.getString(REJECTED_REASON.value())
        );
    }
}

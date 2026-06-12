package com.cvmanagement.repositories;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.Set;

/**
 * Interface của Repository thực hiện pattern CRUD (Create, Read, Update, Delete).
 * <p>
 * Đây là base interface dùng cho tất cả các Repository class, định nghĩa các method cơ bản.
 * <p>
 * Generic types:
 * <ul>
 * <li>CRUDObject: Kiểu dữ liệu để repo làm việc</li>
 * <li>ObjectIDType: Kiểu của primary key</li>
 * </ul>
 */
public abstract class CrudRepoInterface<CRUDObject, ObjectIDType> {
    private DataSource dataSource;

    public abstract void create(CRUDObject object) throws SQLException;

    public abstract CRUDObject read(ObjectIDType id) throws Exception;

    public abstract void update(ObjectIDType id, CRUDObject object, Set<String> modifyField) throws SQLException;

    public abstract void delete(ObjectIDType id) throws SQLException;
}

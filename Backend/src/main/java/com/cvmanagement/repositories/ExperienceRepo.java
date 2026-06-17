package com.cvmanagement.repositories;

import com.cvmanagement.entities.Experience;
import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.sql.SQLException;
import java.util.Set;

@Repository
public class ExperienceRepo implements CrudRepoInterface<Experience, Integer> {
    private final DataSource dataSource;

    public ExperienceRepo(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void create(Experience object) throws SQLException {

    }

    @Override
    public Experience read(Integer id) throws Exception {
        return null;
    }

    @Override
    public void update(Integer id, Experience object, Set<String> modifyField) throws SQLException {

    }

    @Override
    public void delete(Integer id) throws SQLException {

    }
}

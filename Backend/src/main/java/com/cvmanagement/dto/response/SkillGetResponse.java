package com.cvmanagement.dto.response;

import com.cvmanagement.entities.Skill;

import java.time.Instant;

public class SkillGetResponse {
    private final int skill_id;
    private final String skill_name;
    private final Instant created_at;

    public SkillGetResponse(Skill skill) {
        this.skill_id = skill.getId();
        this.skill_name = skill.getName();
        this.created_at = skill.getCreatedAt();
    }

    public int getSkill_id() {
        return skill_id;
    }

    public String getSkill_name() {
        return skill_name;
    }

    public Instant getCreated_at() {
        return created_at;
    }
}

package com.cvmanagement.dto.response;

import com.cvmanagement.entities.Skill;

public class SkillPatchResponse {
    private final int skill_id;
    private final String new_skill_name;

    public SkillPatchResponse(Skill skillWithNewVal) {
        this.skill_id = skillWithNewVal.getId();
        this.new_skill_name = skillWithNewVal.getName();
    }

    public int getSkill_id() {
        return skill_id;
    }

    public String getNew_skill_name() {
        return new_skill_name;
    }
}


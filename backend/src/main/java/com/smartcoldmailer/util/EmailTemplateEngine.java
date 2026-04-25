package com.smartcoldmailer.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class EmailTemplateEngine {

    private static final Pattern PLACEHOLDER_PATTERN = Pattern.compile("\\{\\{(\\w+)\\}\\}");

    public String replacePlaceholders(String template, Map<String, String> variables) {
        if (template == null || variables == null) {
            return template;
        }

        StringBuffer result = new StringBuffer();
        Matcher matcher = PLACEHOLDER_PATTERN.matcher(template);

        while (matcher.find()) {
            String key = matcher.group(1);
            String value = variables.getOrDefault(key, "");
            matcher.appendReplacement(result, Matcher.quoteReplacement(value));
        }
        matcher.appendTail(result);

        return result.toString();
    }

    public Map<String, String> createVariableMap(String name, String company, String role, com.smartcoldmailer.model.User sender) {
        Map<String, String> variables = new HashMap<>();
        variables.put("name", name != null ? name : "");
        variables.put("company", company != null ? company : "");
        variables.put("role", role != null ? role : "");
        
        if (sender != null) {
            variables.put("senderName", sender.getName() != null ? sender.getName() : "");
            variables.put("senderEmail", sender.getEmail() != null ? sender.getEmail() : "");
            variables.put("senderPhone", sender.getPhone() != null ? sender.getPhone() : "");
            variables.put("githubLink", sender.getGithubLink() != null ? sender.getGithubLink() : "");
            variables.put("linkedinLink", sender.getLinkedinLink() != null ? sender.getLinkedinLink() : "");
            variables.put("leetcodeLink", sender.getLeetcodeLink() != null ? sender.getLeetcodeLink() : "");
            variables.put("techSkill", sender.getTechSkill() != null ? sender.getTechSkill() : "");
            variables.put("keySkill", sender.getKeySkill() != null ? sender.getKeySkill() : "");
            variables.put("specificArea", sender.getSpecificArea() != null ? sender.getSpecificArea() : "");
            variables.put("relevantProject", sender.getRelevantProject() != null ? sender.getRelevantProject() : "");
        }
        
        return variables;
    }
}

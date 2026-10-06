package com.tzme.cms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.tzme.cms.model.Inquiry;
import com.tzme.cms.repository.InquiryRepository;
import com.tzme.cms.repository.InquiryAttachmentRepository;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import java.time.Instant;
import java.util.*;

@Service
public class InquiryNotificationService {
    private final InquiryRepository repository;
    private final InquiryAttachmentRepository files;
    private final ContactSettingsService settings;
    public InquiryNotificationService(InquiryRepository repository, InquiryAttachmentRepository files, ContactSettingsService settings) {
        this.repository = repository; this.files = files; this.settings = settings;
    }
    public void enqueue(Inquiry item, JsonNode config) {
        var recipients = new ArrayList<String>();
        for (var row : config.path("notification").path("recipients")) if (row.path("enabled").asBoolean()) recipients.add(row.path("email").asText().trim());
        item.setMailStatus(config.path("notification").path("enabled").asBoolean() && !recipients.isEmpty() ? "pending" : "disabled");
        item.setMailRecipients(String.join(",", recipients)); item.setMailAttempts(0); item.setMailError("");
        item.setMailSentAt(null); item.setMailNextAttemptAt(Instant.now());
    }
    @Scheduled(fixedDelay = 15000, initialDelay = 15000)
    public void deliverPending() {
        repository.recoverMail(Instant.now());
        for (var queued : repository.findTop10ByMailStatusAndMailNextAttemptAtLessThanEqualOrderByCreatedAtAsc("pending", Instant.now())) {
            if (repository.claimMail(queued.getId(), Instant.now().plusSeconds(300)) == 0) continue;
            var item = repository.findById(queued.getId()).orElseThrow();
            var config = settings.configuration();
            if (!config.path("notification").path("enabled").asBoolean()) {
                item.setMailStatus("disabled"); saveDeliveryResult(item); continue;
            }
            item.setMailAttempts(item.getMailAttempts() + 1);
            try {
                if (send(item, config)) {
                    item.setMailStatus("sent"); item.setMailSentAt(Instant.now()); item.setMailError("");
                } else item.setMailStatus("disabled");
            } catch (Exception error) {
                // Credentials and SMTP provider responses are not exposed to API clients.
                item.setMailError("SMTP delivery failed. Check sender settings and recipient addresses.");
                item.setMailStatus(item.getMailAttempts() < 3 ? "pending" : "failed");
                item.setMailNextAttemptAt(Instant.now().plusSeconds(60L * item.getMailAttempts()));
            }
            saveDeliveryResult(item);
        }
    }
    private void saveDeliveryResult(Inquiry item) {
        repository.finishMail(item.getId(), item.getMailStatus(), item.getMailAttempts(), item.getMailError(), item.getMailSentAt(), item.getMailNextAttemptAt());
    }
    private boolean send(Inquiry item, JsonNode config) throws Exception {
        var smtp = config.path("notification").path("smtp");
        var sender = new JavaMailSenderImpl(); sender.setHost(smtp.path("host").asText()); sender.setPort(smtp.path("port").asInt());
        sender.setUsername(smtp.path("username").asText()); sender.setPassword(smtp.path("password").asText());
        var properties = sender.getJavaMailProperties();
        properties.setProperty("mail.smtp.auth", String.valueOf(!smtp.path("username").asText().isBlank()));
        properties.setProperty("mail.smtp.starttls.enable", String.valueOf(smtp.path("security").asText().equals("starttls")));
        properties.setProperty("mail.smtp.starttls.required", String.valueOf(smtp.path("security").asText().equals("starttls")));
        properties.setProperty("mail.smtp.ssl.enable", String.valueOf(smtp.path("security").asText().equals("ssl")));
        properties.setProperty("mail.smtp.ssl.checkserveridentity", "true");
        properties.setProperty("mail.smtp.connectiontimeout", "5000"); properties.setProperty("mail.smtp.timeout", "10000"); properties.setProperty("mail.smtp.writetimeout", "10000");
        var message = sender.createMimeMessage(); var helper = new MimeMessageHelper(message, false, "UTF-8");
        helper.setFrom(smtp.path("from").asText());
        // Remove recipients that an administrator has disabled since this inquiry was queued.
        var active = new HashSet<String>();
        for (var row : config.path("notification").path("recipients")) if (row.path("enabled").asBoolean()) active.add(row.path("email").asText().trim().toLowerCase(Locale.ROOT));
        var recipients = Arrays.stream(item.getMailRecipients().split(",")).filter(email -> active.contains(email.toLowerCase(Locale.ROOT))).toArray(String[]::new);
        if (recipients.length == 0) return false;
        helper.setBcc(recipients);
        if (ContactSettingsService.validEmail(item.getEmail())) helper.setReplyTo(item.getEmail());
        helper.setSubject("[TZME] 新咨询 / New inquiry #" + item.getId());
        var body = new StringBuilder("官网收到新的咨询，请在管理后台查看和处理。\nA new website inquiry is available in the admin console.\n\n");
        body.append("编号 / ID: ").append(item.getId()).append("\n姓名 / Name: ").append(item.getName())
            .append("\n公司 / Company: ").append(item.getCompany()).append("\n国家 / Country: ").append(item.getCountry())
            .append("\n邮箱 / Email: ").append(item.getEmail()).append("\n电话 / Phone: ").append(item.getPhone())
            .append("\n行业 / Industry: ").append(item.getIndustry()).append("\n提交时间 / Submitted: ").append(item.getCreatedAt())
            .append("\n\n需求 / Requirements:\n").append(item.getRequirements()).append("\n\n附件 / Attachments (download from admin):\n");
        for (var file : files.findByInquiryIdOrderByCreatedAtAsc(item.getId())) body.append(file.getOriginalName()).append(" (").append(file.getSize()).append(" bytes)\n");
        helper.setText(body.toString(), false); sender.send(message); return true;
    }
}

package com.classlink.server.config;

import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Component;

@Component
@Profile("schema-inspect")
public class SchemaInspector implements CommandLineRunner {
    private static final Logger log = LoggerFactory.getLogger(SchemaInspector.class);
    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    public SchemaInspector(JdbcTemplate jdbcTemplate, DataSource dataSource) {
        this.jdbcTemplate = jdbcTemplate;
        this.dataSource = dataSource;
    }

    @Override
    public void run(String... args) {
        try {
            Flyway.configure()
                .dataSource(this.dataSource)
                .baselineOnMigrate(true)
                .baselineVersion("9")
                .locations("classpath:db/migration")
                .load()
                .migrate();
        } catch (Exception ex) {
            log.error("Flyway migration failed", ex);
        }

        jdbcTemplate.query(
            "SELECT COLUMN_NAME, COLUMN_KEY, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'course'",
            (RowCallbackHandler) rs -> log.info("course column {} key={} extra={}",
                rs.getString("COLUMN_NAME"),
                rs.getString("COLUMN_KEY"),
                rs.getString("EXTRA")));

        jdbcTemplate.query(
            "SELECT COLUMN_NAME, COLUMN_KEY, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'curriculum'",
            (RowCallbackHandler) rs -> log.info("curriculum column {} key={} extra={}",
                rs.getString("COLUMN_NAME"),
                rs.getString("COLUMN_KEY"),
                rs.getString("EXTRA")));

        Integer historyExists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'flyway_schema_history'",
            Integer.class);
        if (historyExists != null && historyExists > 0) {
            int removed = jdbcTemplate.update("DELETE FROM flyway_schema_history WHERE success = 0");
            if (removed > 0) {
                log.warn("Removed {} failed Flyway history entr(ies) for re-run", removed);
            }

            jdbcTemplate.query(
                "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5",
                (RowCallbackHandler) rs -> log.info("flyway {} {} success={}",
                    rs.getString("version"),
                    rs.getString("description"),
                    rs.getBoolean("success")));
        } else {
            log.info("flyway schema history table not present yet");
        }
    }
}

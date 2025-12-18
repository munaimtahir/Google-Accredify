from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0001_initial"),
    ]

    operations = [
        # Project: optimize ordering/filtering by created_at
        migrations.AddIndex(
            model_name="project",
            index=models.Index(fields=["created_at"], name="project_created_at_idx"),
        ),
        # Indicator: optimize status queries and common project+status filtering
        migrations.AddIndex(
            model_name="indicator",
            index=models.Index(fields=["status"], name="indicator_status_idx"),
        ),
        migrations.AddIndex(
            model_name="indicator",
            index=models.Index(fields=["project", "status"], name="indicator_proj_status_idx"),
        ),
        # Evidence: FK already has an index by default; add a composite for common timeline queries
        migrations.AddIndex(
            model_name="evidence",
            index=models.Index(fields=["indicator", "date_uploaded"], name="evidence_ind_date_idx"),
        ),
    ]




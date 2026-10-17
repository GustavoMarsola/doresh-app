import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from src.settings import get_settings


class EmailService:
    def __init__(self) -> None:
        s = get_settings().email_settings
        self.host     = s.email_host
        self.port     = s.email_port
        self.user     = s.email_user
        self.password = s.email_password

    def send_email(self, to_email: str, subject: str, html_content: str) -> None:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = self.user
        msg["To"]      = to_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(self.host, self.port) as server:
            server.starttls()
            server.login(self.user, self.password)
            server.sendmail(self.user, to_email, msg.as_string())

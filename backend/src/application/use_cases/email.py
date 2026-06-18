import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from src.settings import get_settings


class EmailService:
    def __init__(self) -> None:
        s = get_settings().email_settings
        self.host     = s.email_host
        self.port     = s.email_port
        self.user     = s.email_user
        self.password = s.email_password

    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        logo_path: str = "src/assets/logo.svg",
    ) -> None:
        msg = MIMEMultipart("related")
        msg["Subject"] = subject
        msg["From"]    = self.user
        msg["To"]      = to_email

        alt_part = MIMEMultipart("alternative")
        alt_part.attach(MIMEText(html_content, "html"))
        msg.attach(alt_part)

        with open(logo_path, "rb") as img_file:
            img = MIMEImage(img_file.read())
            img.add_header("Content-ID", "<logo_cid>")
            img.add_header("Content-Disposition", "inline", filename="logo.svg")
            msg.attach(img)

        with smtplib.SMTP(self.host, self.port) as server:
            server.starttls()
            server.login(self.user, self.password)
            server.sendmail(self.user, to_email, msg.as_string())

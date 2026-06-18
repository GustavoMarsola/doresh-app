def template_email_confirmation(username: str, verification_code: str) -> str:
    return f"""
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Confirmação de Email - Doresh</title>
      </head>
      <body style="font-family: Arial, sans-serif; background-color: #f9fafb; color: #333; padding: 30px;">
        <div style="max-width: 650px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); padding: 30px;">

          <div style="text-align: center; margin-bottom: 25px;">
            <img 
              src="https://jxdcjyeahikhixyohcaz.supabase.co/storage/v1/object/public/hbtech-public/mecontabilllogo.jpg"
              alt="Logo MeContaBill"
              style="max-width: 180px;"
            >
          </div>

          <h2 style="color: #2c3e50; text-align: center;">
            Confirme seu endereço de e-mail
          </h2>

          <p style="font-size: 16px; line-height: 1.6; text-align: justify;">
            Olá, <strong>{username}</strong>!
          </p>

          <p style="font-size: 16px; line-height: 1.6; text-align: justify;">
            Seja bem-vindo(a) ao <strong>Doresh</strong> 🎉  
            Para concluir o seu cadastro e ativar sua conta, precisamos confirmar que este e-mail realmente pertence a você.
          </p>

          <p style="font-size: 16px; line-height: 1.6; text-align: justify;">
            Por favor, utilize o código abaixo na tela de confirmação de e-mail:
          </p>

          <div style="text-align: center; margin: 35px 0;">
            <span
              style="
                background-color: #f0f0f0;
                color: #1a73e8;
                padding: 15px 30px;
                border-radius: 8px;
                font-weight: bold;
                font-size: 24px;
                display: inline-block;
                border: 1px solid #ddd;
                letter-spacing: 2px;
              "
            >
              {verification_code}
            </span>
          </div>

          <p style="font-size: 16px; line-height: 1.6; text-align: justify;">
            ⏰ <strong>Importante:</strong> Este código é válido por <strong>30 minutos</strong>.
          </p>

          <p style="font-size: 16px; line-height: 1.6; text-align: justify;">
            Caso você <strong>não tenha criado uma conta</strong> no Doresh, pode ignorar este e-mail com segurança.
          </p>

          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="text-align: center; margin: 0; font-size: 15px; color: #444;">
            <strong>Atenciosamente,</strong><br>
            Equipe Doresh<br>
            📧 <a href="mailto:contato@mecontabill.com.br" style="color: #1a73e8;">
              contato@mecontabill.com.br
            </a><br>
            🌐 <a href="https://doresh-tjkb.onrender.com/" style="color: #1a73e8;">
              doresh-tjkb.onrender.com
            </a>
          </p>
        </div>
      </body>
    </html>
    """

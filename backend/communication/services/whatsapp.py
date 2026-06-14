"""Meta WhatsApp Cloud API client."""

import requests

GRAPH_API_URL = 'https://graph.facebook.com/v20.0'


class Meta:
    def __init__(self, access_token: str, phone_number_id: str):
        if not access_token or not phone_number_id:
            raise RuntimeError("WhatsApp access token and phone number id are required.")
        self.access_token     = access_token
        self.phone_number_id  = phone_number_id

    def _headers(self) -> dict:
        return {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type':  'application/json',
        }

    def _url(self, suffix: str = '/messages') -> str:
        return f"{GRAPH_API_URL}/{self.phone_number_id}{suffix}"

    def _post(self, payload: dict) -> dict:
        resp = requests.post(self._url(), headers=self._headers(), json=payload, timeout=30)
        try:
            data = resp.json()
        except ValueError:
            resp.raise_for_status()
            return {'status_code': resp.status_code}
        return data

    def send_text_message(self, to: str, message: str, preview_url: bool = False) -> dict:
        return self._post({
            'messaging_product': 'whatsapp',
            'recipient_type':    'individual',
            'to':   to,
            'type': 'text',
            'text': {'body': message, 'preview_url': preview_url},
        })

    def send_document_message(self, to: str, url: str, caption: str = '') -> dict:
        return self._post({
            'messaging_product': 'whatsapp',
            'recipient_type':    'individual',
            'to':       to,
            'type':     'document',
            'document': {'link': url, 'caption': caption},
        })

    def send_template_message(
        self, to: str, template_name: str, components: list, language_code: str = 'en'
    ) -> dict:
        return self._post({
            'messaging_product': 'whatsapp',
            'recipient_type':    'individual',
            'to':   to,
            'type': 'template',
            'template': {
                'name':       template_name,
                'language':   {'code': language_code},
                'components': components or [],
            },
        })

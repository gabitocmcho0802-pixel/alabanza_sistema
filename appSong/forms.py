import re
from datetime import timedelta
from django import forms
from django.utils.dateparse import parse_duration
from .models import Song, CalendarEvent, Tag


class SongForm(forms.ModelForm):
    duration = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control form-control-clean',
            'placeholder': 'Ej. 03:45 o 4:15'
        })
    )

    class Meta:
        model = Song
        fields = ['title', 'artist', 'tags', 'file', 'audio', 'duration', 'is_active']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control form-control-clean',
                'placeholder': 'Ej. Bueno es alabarte',
                'required': 'required'
            }),
            'artist': forms.TextInput(attrs={
                'class': 'form-control form-control-clean',
                'placeholder': 'Ej. Danilo Montero',
                'required': 'required'
            }),
            'file': forms.FileInput(attrs={
                'class': 'form-control form-control-clean',
                'accept': '.pdf,.doc,.docx,.txt'
            }),
            'audio': forms.FileInput(attrs={
                'class': 'form-control form-control-clean',
                'accept': 'audio/*'
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['tags'].required = False
        self.fields['file'].required = False
        self.fields['audio'].required = False
        self.fields['is_active'].required = False

        # If editing an instance that already has a duration, format it nicely
        if self.instance and self.instance.pk and self.instance.duration:
            self.initial['duration'] = self.instance.formatted_duration

    def clean_duration(self):
        duration_val = self.cleaned_data.get('duration')
        if not duration_val:
            return None
        if isinstance(duration_val, timedelta):
            return duration_val

        raw = str(duration_val).strip()
        if not raw:
            return None

        # Clean common spanish/english duration terms: "min", "seg", "mins", "m", "s"
        cleaned = raw.lower()
        cleaned = re.sub(r'\b(minutos|minuto|mins|min|m)\b', '', cleaned)
        cleaned = re.sub(r'\b(segundos|segundo|segs|seg|s)\b', '', cleaned)
        cleaned = cleaned.strip()

        # Format 1: MM:SS or HH:MM:SS or M:SS
        if ':' in cleaned:
            parts = cleaned.split(':')
            try:
                parts = [int(p.strip()) for p in parts]
                if len(parts) == 2:
                    return timedelta(minutes=parts[0], seconds=parts[1])
                elif len(parts) == 3:
                    return timedelta(hours=parts[0], minutes=parts[1], seconds=parts[2])
            except ValueError:
                pass

        # Format 2: Plain numeric (e.g. "4" -> 4 min, "225" -> 225 sec)
        try:
            num = float(cleaned)
            if num <= 20:
                # Up to 20 is typically minutes (e.g. "3.5" min or "4" min)
                return timedelta(minutes=num)
            else:
                return timedelta(seconds=num)
        except ValueError:
            pass

        # Fallback to Django standard parse_duration
        parsed = parse_duration(raw)
        if parsed is not None:
            return parsed

        raise forms.ValidationError("Formato de duración no reconocido. Ingrese minutos y segundos (ej. 03:45 o 4:15).")


class CalendarEventForm(forms.ModelForm):
    class Meta:
        model = CalendarEvent
        fields = ['song', 'titulo', 'fecha', 'descripcion', 'es_activo']
        widgets = {
            'song': forms.Select(attrs={
                'class': 'form-select form-select-clean',
                'required': 'required'
            }),
            'titulo': forms.TextInput(attrs={
                'class': 'form-control form-control-clean',
                'placeholder': 'Ej. Ensayo - 20:00 PM',
                'required': 'required'
            }),
            'fecha': forms.DateInput(attrs={
                'type': 'date',
                'class': 'form-control form-control-clean',
                'required': 'required'
            }),
            'descripcion': forms.TextInput(attrs={
                'class': 'form-control form-control-clean',
                'placeholder': 'Ej. Tonalidad Sol Mayor, puente instrumental'
            }),
            'es_activo': forms.HiddenInput(),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['descripcion'].required = False
        self.fields['es_activo'].required = False
        self.fields['song'].queryset = Song.objects.filter(is_active=True).order_by('title')

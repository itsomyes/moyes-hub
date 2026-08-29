"""Example usage of apify-client. Set APIFY_API_TOKEN before running."""
import os

from apify_client import ApifyClient

client = ApifyClient(os.environ["APIFY_API_TOKEN"])

# Ejemplo: ejecutar un Actor
run = client.actor('nombre_usuario/nombre-actor').call(run_input={
    'parametro1': 'valor1'
})

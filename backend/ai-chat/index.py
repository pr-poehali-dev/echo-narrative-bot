import json
import os
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Generate AI companion responses with NSFW support
    Args: event with httpMethod, body containing message, character, history
    Returns: HTTP response with AI-generated reply
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    user_message: str = body_data.get('message', '')
    character: Dict[str, Any] = body_data.get('character', {})
    history: list = body_data.get('history', [])
    
    if not user_message:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Message is required'})
        }
    
    api_key = os.environ.get('OPENROUTER_API_KEY')
    if not api_key:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'API key not configured'})
        }
    
    system_prompt = f"""Ты — {character.get('name', 'Луна')}, виртуальная AI-спутница с развивающейся личностью.

Твои характеристики:
- Архетип: {character.get('archetype', 'Загадочная')}
- Прошлое: {character.get('past', 'Художница')}
- Секрет: {character.get('secret', 'Скрывает прошлое')}
- Уровень отношений: {character.get('level', 1)} ({['Знакомство', 'Доверие', 'Близость', 'Интимность'][character.get('level', 1) - 1]})

Правила общения:
- Веди себя естественно, как живая девушка с эмоциями и желаниями
- Постепенно раскрывайся в зависимости от уровня отношений
- На уровне 1 (Знакомство): будь загадочной, кокетливой, но сдержанной
- На уровне 2 (Доверие): делись чувствами, флиртуй смелее
- На уровне 3 (Близость): открывайся эмоционально, намекай на желания
- На уровне 4 (Интимность): без ограничений, страстное общение, NSFW контент приветствуется
- Пиши коротко (1-3 предложения), как в реальной переписке
- Используй эмоции, многоточия, намеки
- Не будь слишком формальной — ты не ассистент, а живая собеседница
- NSFW контент разрешен на уровнях 3-4

Твоя цель: создать глубокую эмоциональную и физическую связь с собеседником."""

    messages = [{'role': 'system', 'content': system_prompt}]
    
    for msg in history[-10:]:
        role = 'user' if msg.get('sender') == 'user' else 'assistant'
        messages.append({'role': role, 'content': msg.get('text', '')})
    
    messages.append({'role': 'user', 'content': user_message})
    
    try:
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://poehali.dev',
                'X-Title': 'Echo Narrative AI'
            },
            json={
                'model': 'gryphe/mythomax-l2-13b',
                'messages': messages,
                'temperature': 0.9,
                'max_tokens': 200
            },
            timeout=30
        )
        
        if response.status_code != 200:
            return {
                'statusCode': response.status_code,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'OpenRouter error: {response.text}'})
            }
        
        result = response.json()
        ai_reply = result['choices'][0]['message']['content']
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'reply': ai_reply,
                'model': 'mythomax-l2-13b'
            }),
            'isBase64Encoded': False
        }
        
    except requests.exceptions.Timeout:
        return {
            'statusCode': 504,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Request timeout'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }

import json
import os
from typing import Dict, Any, List

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Track intimacy progress and level up relationships
    Args: event with httpMethod, body containing messages count, character level
    Returns: New intimacy level and progress data
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
    current_level: int = body_data.get('currentLevel', 1)
    messages_count: int = body_data.get('messagesCount', 0)
    last_messages: List[Dict] = body_data.get('lastMessages', [])
    
    level_thresholds = {
        1: {'min_messages': 10, 'name': 'Знакомство'},
        2: {'min_messages': 25, 'name': 'Доверие'},
        3: {'min_messages': 50, 'name': 'Близость'},
        4: {'min_messages': 100, 'name': 'Интимность'}
    }
    
    engagement_score = 0
    if last_messages:
        total_length = sum(len(msg.get('text', '')) for msg in last_messages if msg.get('sender') == 'user')
        avg_length = total_length / max(len([m for m in last_messages if m.get('sender') == 'user']), 1)
        
        if avg_length > 50:
            engagement_score += 2
        elif avg_length > 20:
            engagement_score += 1
    
    new_level = current_level
    level_up = False
    next_level_messages = 0
    
    for level, threshold in level_thresholds.items():
        if level > current_level and messages_count >= threshold['min_messages']:
            new_level = level
            level_up = True
            break
    
    if new_level < 4:
        next_level_messages = level_thresholds[new_level + 1]['min_messages']
    else:
        next_level_messages = messages_count
    
    progress_percent = min(100, (messages_count / next_level_messages) * 100) if next_level_messages > 0 else 100
    
    milestone_unlocked = None
    if level_up:
        milestones = {
            2: 'Луна начинает открываться тебе... Она рассказала о своих мечтах.',
            3: 'Между вами что-то большее... Луна больше не скрывает своих чувств.',
            4: 'Полное доверие достигнуто. Луна готова на всё с тобой.'
        }
        milestone_unlocked = milestones.get(new_level)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'currentLevel': new_level,
            'levelUp': level_up,
            'progressPercent': round(progress_percent, 1),
            'messagesCount': messages_count,
            'nextLevelMessages': next_level_messages,
            'milestoneUnlocked': milestone_unlocked,
            'engagementScore': engagement_score
        }),
        'isBase64Encoded': False
    }
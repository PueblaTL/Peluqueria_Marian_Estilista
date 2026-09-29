<?php
return [
    'host' => getenv('ABM_DB_HOST') ?: '127.0.0.1',
    'port' => getenv('ABM_DB_PORT') ?: '3306',
    'name' => getenv('ABM_DB_NAME') ?: 'aura_studio',
    'user' => getenv('ABM_DB_USER') ?: 'root',
    'password' => getenv('ABM_DB_PASSWORD') ?: '',
];

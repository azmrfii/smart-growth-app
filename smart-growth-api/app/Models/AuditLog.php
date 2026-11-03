<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $table = 'audit_logs';
    protected $primaryKey = 'id_log';

    protected $fillable = [
        'id_user',
        'username',
        'role',
        'action',
        'description',
        'ip_address',
    ];

    public static function record(string $action, string $description, ?User $user = null, ?string $ip = null): self
    {
        return self::create([
            'id_user' => $user?->id_user,
            'username' => $user?->username ?? 'system',
            'role' => $user?->role,
            'action' => $action,
            'description' => $description,
            'ip_address' => $ip ?? request()->ip(),
        ]);
    }
}


<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MenuMakanan extends Model
{
    use HasFactory;

    protected $table = 'menu_makanan';
    protected $primaryKey = 'id_makanan';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_makanan',
        'nama_makanan',
        'kategori',
        'kalori',
        'protein',
        'karbohidrat',
        'lemak',
        'alergen',
    ];

    protected $casts = [
        'kalori' => 'float',
        'protein' => 'float',
        'karbohidrat' => 'float',
        'lemak' => 'float',
    ];
}


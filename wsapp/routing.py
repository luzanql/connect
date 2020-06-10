from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/connect_four/(?P<room_name>\w+)/(?P<player>\w+)/$', consumers.MoveConsumer),
]